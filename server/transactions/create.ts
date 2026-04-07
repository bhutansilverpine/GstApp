"use server";

import { revalidatePath } from "next/cache";
import { db, transactions, transactionLines, accounts, organizations } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import type {
  CreateTransactionInput,
  CreateTransactionLineInput,
  TransactionBalance,
  ApiResponse,
} from "@/types";

/**
 * Create a double-entry journal entry
 * Validates debits equal credits and updates account balances
 */
export async function createTransaction(
  input: CreateTransactionInput,
  organizationId: string,
  userId: string
): Promise<ApiResponse<{ transaction: any; lines: any[] }>> {
  try {
    // Validate organization exists
    const orgCheck = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!orgCheck.length) {
      return {
        success: false,
        error: "Organization not found",
      };
    }

    // Validate required fields
    if (!input.description) {
      return {
        success: false,
        error: "Description is required",
      };
    }

    if (!input.date) {
      return {
        success: false,
        error: "Transaction date is required",
      };
    }

    if (!input.lines || input.lines.length < 2) {
      return {
        success: false,
        error: "At least two transaction lines are required",
      };
    }

    // Validate transaction lines
    const validationResult = validateTransactionLines(input.lines);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // Verify all accounts exist and belong to organization
    const accountIds = input.lines.map((line) => line.accountId);
    const accountChecks = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.organizationId, organizationId),
          sql`${accounts.id} = ANY(${accountIds})`
        )
      );

    if (accountChecks.length !== accountIds.length) {
      return {
        success: false,
        error: "One or more accounts not found or don't belong to this organization",
      };
    }

    // Create transaction within a transaction block
    const result = await db.transaction(async (tx) => {
      // Create main transaction record
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          organizationId: organizationId,
          date: input.date,
          description: input.description,
          reference: input.reference,
          journalType: input.journalType || "general",
          isPosted: input.isPosted || false,
          isReconciled: false,
          createdBy: userId,
        })
        .returning();

      if (!newTransaction) {
        throw new Error("Failed to create transaction");
      }

      // Create transaction lines
      const lineInputs = input.lines.map((line) => ({
        transactionId: newTransaction.id,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      }));

      const newLines = await tx
        .insert(transactionLines)
        .values(lineInputs)
        .returning();

      // Update account balances if transaction is posted
      if (input.isPosted) {
        await updateAccountBalances(tx, input.lines);
      }

      return { transaction: newTransaction, lines: newLines };
    });

    console.log(`Created transaction: ${result.transaction.id}`);

    // Revalidate cache
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reports');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Create transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

/**
 * Validate transaction lines balance
 * Ensures debits equal credits
 */
function validateTransactionLines(
  lines: CreateTransactionLineInput[]
): { isValid: boolean; error?: string; balance?: TransactionBalance } {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      error: "At least two transaction lines are required",
    };
  }

  let totalDebits = 0;
  let totalCredits = 0;

  for (const line of lines) {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    // Validate that each line has either debit or credit, not both
    if (debit > 0 && credit > 0) {
      return {
        isValid: false,
        error: `Line for account ${line.accountId} has both debit and credit values`,
      };
    }

    // Validate that at least one value is positive
    if (debit === 0 && credit === 0) {
      return {
        isValid: false,
        error: `Line for account ${line.accountId} has no debit or credit value`,
      };
    }

    totalDebits += debit;
    totalCredits += credit;
  }

  // Check if debits equal credits (allow small floating point differences)
  const difference = Math.abs(totalDebits - totalCredits);
  const tolerance = 0.01; // 1 cent tolerance

  if (difference > tolerance) {
    return {
      isValid: false,
      error: `Transaction is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}, Difference: ${difference}`,
    };
  }

  return {
    isValid: true,
    balance: {
      transactionId: "",
      debits: totalDebits,
      credits: totalCredits,
      isBalanced: true,
    },
  };
}

/**
 * Update account balances after posting transaction
 */
async function updateAccountBalances(
  tx: any,
  lines: CreateTransactionLineInput[]
): Promise<void> {
  for (const line of lines) {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (debit === 0 && credit === 0) continue;

    // Get current account
    const [account] = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.id, line.accountId))
      .limit(1);

    if (!account) continue;

    const currentBalance = Number(account.balance) || 0;
    let newBalance = currentBalance;

    // Update balance based on account type and transaction type
    const accountType = account.type;

    if (accountType === "asset" || accountType === "expense") {
      // Debit increases, credit decreases
      newBalance = currentBalance + debit - credit;
    } else if (accountType === "liability" || accountType === "equity" || accountType === "revenue") {
      // Credit increases, debit decreases
      newBalance = currentBalance + credit - debit;
    }

    // Update account balance
    await tx
      .update(accounts)
      .set({
        balance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, line.accountId));
  }
}

/**
 * Post an existing transaction (mark as posted and update balances)
 */
export async function postTransaction(
  transactionId: string,
  organizationId: string
): Promise<ApiResponse<any>> {
  try {
    // Get transaction with lines
    const [transaction] = await db
      .select({
        id: transactions.id,
        isPosted: transactions.isPosted,
        date: transactions.date,
        description: transactions.description,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (transaction.isPosted) {
      return {
        success: false,
        error: "Transaction is already posted",
      };
    }

    // Get transaction lines
    const lines = await db
      .select({
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .where(eq(transactionLines.transactionId, transactionId));

    // Convert to CreateTransactionLineInput format
    const lineInputs: CreateTransactionLineInput[] = lines.map((line) => ({
      accountId: line.accountId,
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
    }));

    // Update account balances within transaction
    await db.transaction(async (tx) => {
      await updateAccountBalances(tx, lineInputs);

      // Mark transaction as posted
      await tx
        .update(transactions)
        .set({
          isPosted: true,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));
    });

    console.log(`Posted transaction: ${transactionId}`);

    // Revalidate cache
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reports');

    return {
      success: true,
      data: { message: "Transaction posted successfully" },
    };
  } catch (error) {
    console.error("Post transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post transaction",
    };
  }
}

/**
 * Reverse a posted transaction
 * Creates reversing entries and updates balances
 */
export async function reverseTransaction(
  transactionId: string,
  organizationId: string,
  reason: string
): Promise<ApiResponse<any>> {
  try {
    // Get original transaction
    const [originalTransaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!originalTransaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (!originalTransaction.isPosted) {
      return {
        success: false,
        error: "Cannot reverse unposted transaction",
      };
    }

    // Get original lines
    const originalLines = await db
      .select()
      .from(transactionLines)
      .where(eq(transactionLines.transactionId, transactionId));

    // Create reversing transaction
    const reversingLines: CreateTransactionLineInput[] = originalLines.map((line) => ({
      accountId: line.accountId,
      debit: Number(line.credit) || 0, // Swap debit and credit
      credit: Number(line.debit) || 0,
      description: `Reversal of: ${line.description || ""}`,
    }));

    const reversingInput: CreateTransactionInput = {
      organizationId: organizationId,
      date: new Date(),
      description: `REVERSAL: ${originalTransaction.description} | Reason: ${reason}`,
      reference: originalTransaction.reference
        ? `REV-${originalTransaction.reference}`
        : undefined,
      journalType: "adjustment",
      lines: reversingLines,
      isPosted: true, // Auto-post reversing entries
    };

    // Create reversing transaction
    const result = await createTransaction(
      reversingInput,
      organizationId,
      "system"
    );

    if (!result.success) {
      return {
        success: false,
        error: "Failed to create reversing transaction",
      };
    }

    // Mark original transaction as reversed
    await db
      .update(transactions)
      .set({
        isReconciled: true, // Mark as reconciled to prevent further processing
      })
      .where(eq(transactions.id, transactionId));

    console.log(`Reversed transaction: ${transactionId}`);

    // Revalidate cache
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reports');

    return {
      success: true,
      data: {
        message: "Transaction reversed successfully",
        reversingTransactionId: result.data?.transaction.id,
      },
    };
  } catch (error) {
    console.error("Reverse transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reverse transaction",
    };
  }
}

/**
 * Delete an unposted transaction
 */
export async function deleteTransaction(
  transactionId: string,
  organizationId: string
): Promise<ApiResponse<any>> {
  try {
    // Get transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (transaction.isPosted) {
      return {
        success: false,
        error: "Cannot delete posted transaction. Reverse it instead.",
      };
    }

    // Delete transaction (cascade will delete lines)
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organizationId, organizationId)
        )
      );

    console.log(`Deleted transaction: ${transactionId}`);

    // Revalidate cache
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reports');

    return {
      success: true,
      data: { message: "Transaction deleted successfully" },
    };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

/**
 * Update transaction details (only for unposted transactions)
 */
export async function updateTransaction(
  transactionId: string,
  organizationId: string,
  updates: {
    description?: string;
    reference?: string;
    date?: Date;
    lines?: CreateTransactionLineInput[];
  }
): Promise<ApiResponse<any>> {
  try {
    // Get transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (transaction.isPosted) {
      return {
        success: false,
        error: "Cannot update posted transaction. Reverse and recreate instead.",
      };
    }

    // Validate new lines if provided
    if (updates.lines) {
      const validationResult = validateTransactionLines(updates.lines);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }
    }

    // Update within transaction
    await db.transaction(async (tx) => {
      // Update main transaction record
      await tx
        .update(transactions)
        .set({
          ...(updates.description && { description: updates.description }),
          ...(updates.reference && { reference: updates.reference }),
          ...(updates.date && { date: updates.date }),
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      // Update lines if provided
      if (updates.lines) {
        // Delete existing lines
        await tx
          .delete(transactionLines)
          .where(eq(transactionLines.transactionId, transactionId));

        // Insert new lines
        const lineInputs = updates.lines.map((line) => ({
          transactionId: transactionId,
          accountId: line.accountId,
          description: line.description,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
        }));

        await tx.insert(transactionLines).values(lineInputs);
      }
    });

    console.log(`Updated transaction: ${transactionId}`);

    // Revalidate cache
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reports');

    return {
      success: true,
      data: { message: "Transaction updated successfully" },
    };
  } catch (error) {
    console.error("Update transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}
