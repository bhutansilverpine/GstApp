"use server";

import { revalidatePath } from "next/cache";
import { db, receipts, accounts, organizations } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import type { UpdateReceiptInput, ApiResponse } from "@/types";

// Helper function to get account for receipt category
async function getAccountForCategory(category: string, organizationId: string) {
  // Map common receipt categories to default expense accounts
  // In a real system, these would be configurable per organization
  const categoryAccountMap: Record<string, string> = {
    "FUEL": "Fuel Expense",
    "FOOD": "Meals & Entertainment",
    "SHOPPING": "Office Supplies",
    "UTILITY": "Utilities",
    "TRAVEL": "Travel Expenses",
    "MISC/PERSONAL": "Miscellaneous Expense",
    "OTHER": "General Expense",
  };

  const accountName = categoryAccountMap[category] || "General Expense";

  const accountResults = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.name, accountName)
      )
    )
    .limit(1);

  return accountResults[0] || null;
}

// Helper function to get GST input tax account
async function getGSTInputAccount(organizationId: string) {
  const accountResults = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.name, "GST Input Tax")
      )
    )
    .limit(1);

  return accountResults[0] || null;
}

// Helper function to get default accounts payable account
async function getAccountsPayableAccount(organizationId: string) {
  const accountResults = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.name, "Accounts Payable")
      )
    )
    .limit(1);

  return accountResults[0] || null;
}

// Helper function to create journal entry for verified receipt
async function createJournalEntryForReceipt(receipt: any, organizationId: string) {
  try {
    const expenseAccount = await getAccountForCategory(receipt.category || "OTHER", organizationId);
    const gstAccount = await getGSTInputAccount(organizationId);
    const payableAccount = await getAccountsPayableAccount(organizationId);

    if (!expenseAccount || !payableAccount) {
      console.log("Required accounts not found, skipping journal entry creation");
      return null;
    }

    // Import the createTransaction function to avoid circular dependency
    const { createTransaction: createJournalEntry } = await import("../transactions/create");

    const totalAmount = Number(receipt.totalAmount || 0);
    const gstAmount = Number(receipt.gstAmount || 0);
    const subtotal = totalAmount - gstAmount;

    // Create journal entry lines
    const lines = [
      {
        accountId: expenseAccount.id,
        debit: subtotal.toFixed(2),
        credit: "0",
        description: `${receipt.vendorName} - ${receipt.description || receipt.category}`,
      },
    ];

    // Add GST line if applicable
    if (gstAmount > 0 && gstAccount) {
      lines.push({
        accountId: gstAccount.id,
        debit: gstAmount.toFixed(2),
        credit: "0",
        description: "GST Input Tax (7%)",
      });
    }

    // Add credit line
    lines.push({
      accountId: payableAccount.id,
      debit: "0",
      credit: totalAmount.toFixed(2),
      description: `Accounts Payable - ${receipt.vendorName}`,
    });

    // Create the transaction
    const result = await createJournalEntry({
      date: receipt.date ? new Date(receipt.date).toISOString() : new Date().toISOString(),
      description: `Receipt: ${receipt.vendorName} - ${receipt.description || receipt.category}`,
      reference: receipt.id, // Link to receipt
      type: "purchase",
      lines,
    }, organizationId, "system");

    return result;
  } catch (error) {
    console.error("Error creating journal entry for receipt:", error);
    return null;
  }
}

/**
 * Verify and update AI-extracted receipt data
 * Allows users to correct any extraction errors before posting
 */
export async function verifyReceipt(
  receiptId: string,
  organizationId: string,
  updates: UpdateReceiptInput
): Promise<ApiResponse<{ receipt: any }>> {
  try {
    // Find the receipt
    const existingReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!existingReceipts.length) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    const existingReceipt = existingReceipts[0];

    // Recalculate GST if TPN or amount changed
    let gstAmount = updates.gstAmount;
    let subtotal = updates.subtotal;

    if (updates.vendorTpn !== undefined || updates.totalAmount !== undefined) {
      const hasTpn = updates.vendorTpn || existingReceipt.vendorTpn;
      const totalAmount = updates.totalAmount ?? existingReceipt.totalAmount;

      if (hasTpn && hasTpn.length > 0) {
        gstAmount = Number(totalAmount) * 0.07;
        subtotal = Number(totalAmount) - gstAmount;
      } else {
        gstAmount = 0;
        subtotal = Number(totalAmount);
      }
    }

    // Create receipt records in database
    const receiptInputs: any[] = [];
    const updateData: any = {
      ...updates,
      gstAmount: gstAmount?.toString(),
      subtotal: subtotal?.toString(),
      status: "verified",
      verifiedAt: new Date(),
      updatedAt: new Date(),
    };

    // Ensure totalAmount is a string if it exists in updates
    if (updates.totalAmount !== undefined) {
      updateData.totalAmount = updates.totalAmount.toString();
    }

    const updatedReceipts = await db
      .update(receipts)
      .set(updateData)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .returning();

    console.log(`Verified receipt: ${receiptId}`);

    // Create journal entry for the verified receipt
    const updatedReceipt = updatedReceipts[0];
    try {
      const journalEntryResult = await createJournalEntryForReceipt(updatedReceipt, organizationId);

      if (journalEntryResult?.success && journalEntryResult.data?.transaction?.id) {
        // Link receipt to transaction
        await db
          .update(receipts)
          .set({ transactionId: journalEntryResult.data.transaction.id })
          .where(eq(receipts.id, receiptId));

        console.log(`Created journal entry ${journalEntryResult.data.transaction.id} for receipt ${receiptId}`);
      }
    } catch (journalError) {
      console.error("Failed to create journal entry for receipt:", journalError);
      // Don't fail the receipt verification if journal entry creation fails
    }

    // Revalidate cache
    revalidatePath('/dashboard/receipts');
    revalidatePath('/dashboard/transactions');
    revalidatePath('/dashboard/reconcile');

    return {
      success: true,
      data: { receipt: updatedReceipts[0] },
    };
  } catch (error) {
    console.error("Receipt verification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify receipt",
    };
  }
}

/**
 * Batch verify multiple receipts
 */
export async function batchVerifyReceipts(
  receiptIds: string[],
  organizationId: string,
  updates: UpdateReceiptInput
): Promise<ApiResponse<{ count: number }>> {
  try {
    let verifiedCount = 0;

    for (const receiptId of receiptIds) {
      const result = await verifyReceipt(receiptId, organizationId, updates);
      if (result.success) {
        verifiedCount++;
      }
    }

    console.log(`Batch verified ${verifiedCount} receipts`);

    return {
      success: true,
      data: { count: verifiedCount },
    };
  } catch (error) {
    console.error("Batch receipt verification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch verify receipts",
    };
  }
}

/**
 * Reject a receipt (marks as rejected with reason)
 */
export async function rejectReceipt(
  receiptId: string,
  organizationId: string,
  reason: string
): Promise<ApiResponse<{ receipt: any }>> {
  try {
    const updatedReceipts = await db
      .update(receipts)
      .set({
        status: "rejected",
        notes: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .returning();

    if (!updatedReceipts.length) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    console.log(`Rejected receipt: ${receiptId} - Reason: ${reason}`);

    // Revalidate cache
    revalidatePath('/dashboard/receipts');

    return {
      success: true,
      data: { receipt: updatedReceipts[0] },
    };
  } catch (error) {
    console.error("Receipt rejection error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject receipt",
    };
  }
}

/**
 * Flag a receipt for manual review
 */
export async function flagReceipt(
  receiptId: string,
  organizationId: string,
  flagReason: string
): Promise<ApiResponse<{ receipt: any }>> {
  try {
    const updatedReceipts = await db
      .update(receipts)
      .set({
        status: "flagged",
        notes: flagReason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .returning();

    if (!updatedReceipts.length) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    console.log(`Flagged receipt: ${receiptId} - Reason: ${flagReason}`);

    // Revalidate cache
    revalidatePath('/dashboard/receipts');

    return {
      success: true,
      data: { receipt: updatedReceipts[0] },
    };
  } catch (error) {
    console.error("Receipt flagging error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to flag receipt",
    };
  }
}

/**
 * Delete a receipt (only pending receipts can be deleted)
 */
export async function deleteReceipt(
  receiptId: string,
  organizationId: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Check if receipt exists and can be deleted
    const existingReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!existingReceipts.length) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    const receipt = existingReceipts[0];

    // Only allow deletion of pending receipts
    if (receipt.status !== "pending") {
      return {
        success: false,
        error: "Only pending receipts can be deleted. Verified receipts must be rejected first.",
      };
    }

    // Delete receipt
    await db
      .delete(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      );

    console.log(`Deleted receipt: ${receiptId}`);

    // Revalidate cache
    revalidatePath('/dashboard/receipts');

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Receipt deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete receipt",
    };
  }
}
