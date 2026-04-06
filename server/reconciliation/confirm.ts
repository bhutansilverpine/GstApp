"use server";

import { revalidatePath } from "next/cache";
import { db, bankTransactions, receipts, transactions, transactionLines } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/types";

/**
 * Confirm a suggested match between bank transaction and receipt
 * Creates the journal entry and updates both records
 */
export async function confirmMatch(
  bankTransactionId: string,
  receiptId: string,
  organizationId: string,
  notes?: string
): Promise<ApiResponse<{ transactionId: string }>> {
  try {
    // Get bank transaction
    const [bankTx] = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, bankTransactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!bankTx) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    // Get receipt
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!receipt) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    // Verify receipt is verified
    if (receipt.status !== "verified") {
      return {
        success: false,
        error: "Receipt must be verified before reconciliation",
      };
    }

    // Check if bank transaction is already reconciled
    if (bankTx.isReconciled) {
      return {
        success: false,
        error: "Bank transaction is already reconciled",
      };
    }

    // Create journal entry for the reconciliation
    const amount = Math.abs(Number(bankTx.amount) || 0);
    const isDebit = Number(bankTx.amount) < 0;

    // Determine accounts (you may want to make these configurable)
    // For now, we'll use placeholder account IDs
    const bankAccountId = bankTx.categoryId || "placeholder-bank-account-id";
    const expenseAccountId = "placeholder-expense-account-id";

    // Create transaction lines
    const lines = [
      {
        accountId: bankAccountId,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        description: `Payment to ${receipt.vendorName}`,
      },
      {
        accountId: expenseAccountId,
        debit: isDebit ? 0 : amount,
        credit: isDebit ? amount : 0,
        description: receipt.description || `Expense: ${receipt.category}`,
      },
    ];

    // Create transaction within a transaction block
    const result = await db.transaction(async (tx) => {
      // Create journal entry
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          organizationId: organizationId,
          date: bankTx.date || new Date(),
          description: `Reconciliation: ${receipt.vendorName} - ${receipt.description}`,
          reference: bankTx.reference || receiptId.substring(0, 8),
          journalType: "payment",
          isPosted: true,
          isReconciled: true,
          createdBy: "system",
        })
        .returning();

      if (!newTransaction) {
        throw new Error("Failed to create transaction");
      }

      // Create transaction lines
      const lineInputs = lines.map((line) => ({
        transactionId: newTransaction.id,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      }));

      await tx.insert(transactionLines).values(lineInputs);

      // Update bank transaction
      await tx
        .update(bankTransactions)
        .set({
          transactionId: newTransaction.id,
          receiptId: receiptId,
          isReconciled: true,
          reconciledAt: new Date(),
          status: "reconciled",
          notes: notes || `Matched with receipt: ${receipt.vendorName}`,
          updatedAt: new Date(),
        })
        .where(eq(bankTransactions.id, bankTransactionId));

      return newTransaction;
    });

    console.log(
      `Confirmed match: Bank TX ${bankTransactionId} <-> Receipt ${receiptId}, created transaction ${result.id}`
    );

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);
    revalidatePath(`/dashboard/${organizationId}/bank`);
    revalidatePath(`/dashboard/${organizationId}/receipts`);

    return {
      success: true,
      data: { transactionId: result.id },
    };
  } catch (error) {
    console.error("Confirm match error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm match",
    };
  }
}

/**
 * Reject a suggested match
 */
export async function rejectMatch(
  bankTransactionId: string,
  organizationId: string,
  reason: string
): Promise<ApiResponse<any>> {
  try {
    // Update bank transaction with rejection note
    const [updated] = await db
      .update(bankTransactions)
      .set({
        notes: `Match rejected: ${reason}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bankTransactions.id, bankTransactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    console.log(`Rejected match for bank transaction: ${bankTransactionId} - ${reason}`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Reject match error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject match",
    };
  }
}

/**
 * Batch confirm multiple matches
 */
export async function batchConfirmMatches(
  matches: Array<{ bankTransactionId: string; receiptId: string }>,
  organizationId: string,
  notes?: string
): Promise<ApiResponse<{ confirmed: number; failed: number }>> {
  try {
    let confirmed = 0;
    let failed = 0;

    for (const match of matches) {
      const result = await confirmMatch(
        match.bankTransactionId,
        match.receiptId,
        organizationId,
        notes
      );

      if (result.success) {
        confirmed++;
      } else {
        failed++;
      }
    }

    console.log(
      `Batch confirmed ${confirmed} matches, ${failed} failed`
    );

    return {
      success: true,
      data: { confirmed, failed },
    };
  } catch (error) {
    console.error("Batch confirm matches error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch confirm matches",
    };
  }
}

/**
 * Unconfirm a match (undo reconciliation)
 */
export async function unconfirmMatch(
  bankTransactionId: string,
  organizationId: string,
  reason: string
): Promise<ApiResponse<any>> {
  try {
    // Get bank transaction
    const [bankTx] = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, bankTransactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!bankTx) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    if (!bankTx.isReconciled) {
      return {
        success: false,
        error: "Bank transaction is not reconciled",
      };
    }

    // Get transaction if exists
    let transactionId = bankTx.transactionId;

    // Update within transaction block
    await db.transaction(async (tx) => {
      // Update bank transaction
      await tx
        .update(bankTransactions)
        .set({
          transactionId: null,
          receiptId: null,
          isReconciled: false,
          reconciledAt: null,
          status: "unreconciled",
          notes: `Unreconciled: ${reason}`,
          updatedAt: new Date(),
        })
        .where(eq(bankTransactions.id, bankTransactionId));

      // Delete or reverse the journal entry if it exists
      if (transactionId) {
        // For simplicity, we'll just delete the transaction
        // In production, you might want to create a reversing entry
        await tx
          .delete(transactions)
          .where(eq(transactions.id, transactionId));
      }
    });

    console.log(`Unconfirmed match for bank transaction: ${bankTransactionId}`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);
    revalidatePath(`/dashboard/${organizationId}/bank`);
    revalidatePath(`/dashboard/${organizationId}/receipts`);
    revalidatePath(`/dashboard/${organizationId}/transactions`);

    return {
      success: true,
      data: { message: "Match unconfirmed successfully" },
    };
  } catch (error) {
    console.error("Unconfirm match error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unconfirm match",
    };
  }
}

/**
 * Manually create a reconciliation match
 * Allows users to manually link bank transactions to receipts
 */
export async function manualMatch(
  bankTransactionId: string,
  receiptId: string,
  organizationId: string,
  notes?: string
): Promise<ApiResponse<{ transactionId: string }>> {
  try {
    // Use the same confirmation logic
    return await confirmMatch(bankTransactionId, receiptId, organizationId, notes);
  } catch (error) {
    console.error("Manual match error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create manual match",
    };
  }
}

/**
 * Create a bank transaction without receipt (for payments without receipts)
 */
export async function reconcileWithoutReceipt(
  bankTransactionId: string,
  organizationId: string,
  categoryId: string,
  description: string
): Promise<ApiResponse<{ transactionId: string }>> {
  try {
    // Get bank transaction
    const [bankTx] = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, bankTransactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!bankTx) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    // Create journal entry
    const amount = Math.abs(Number(bankTx.amount) || 0);
    const isDebit = Number(bankTx.amount) < 0;

    const lines = [
      {
        accountId: categoryId, // Bank account
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        description: description || bankTx.description,
      },
      {
        accountId: categoryId, // Expense account (should be different in real implementation)
        debit: isDebit ? 0 : amount,
        credit: isDebit ? amount : 0,
        description: description || bankTx.description,
      },
    ];

    // Create transaction
    const result = await db.transaction(async (tx) => {
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          organizationId: organizationId,
          date: bankTx.date || new Date(),
          description: description || bankTx.description,
          reference: bankTx.reference,
          journalType: "payment",
          isPosted: true,
          isReconciled: true,
          createdBy: "system",
        })
        .returning();

      if (!newTransaction) {
        throw new Error("Failed to create transaction");
      }

      // Create transaction lines
      const lineInputs = lines.map((line) => ({
        transactionId: newTransaction.id,
        accountId: line.accountId,
        description: line.description,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      }));

      await tx.insert(transactionLines).values(lineInputs);

      // Update bank transaction
      await tx
        .update(bankTransactions)
        .set({
          transactionId: newTransaction.id,
          categoryId: categoryId,
          isReconciled: true,
          reconciledAt: new Date(),
          status: "reconciled",
          notes: "Reconciled without receipt",
          updatedAt: new Date(),
        })
        .where(eq(bankTransactions.id, bankTransactionId));

      return newTransaction;
    });

    console.log(
      `Reconciled bank transaction ${bankTransactionId} without receipt`
    );

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);
    revalidatePath(`/dashboard/${organizationId}/bank`);

    return {
      success: true,
      data: { transactionId: result.id },
    };
  } catch (error) {
    console.error("Reconcile without receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reconcile without receipt",
    };
  }
}
