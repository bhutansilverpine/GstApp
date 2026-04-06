"use server";

import { revalidatePath } from "next/cache";
import { db, receipts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import type { UpdateReceiptInput, ApiResponse } from "@/types";

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

    // Update receipt with verified data
    const updatedReceipts = await db
      .update(receipts)
      .set({
        ...updates,
        gstAmount: gstAmount?.toString(),
        subtotal: subtotal?.toString(),
        status: "verified",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .returning();

    console.log(`Verified receipt: ${receiptId}`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/receipts`);
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);

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
    revalidatePath(`/dashboard/${organizationId}/receipts`);

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
    revalidatePath(`/dashboard/${organizationId}/receipts`);

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
    revalidatePath(`/dashboard/${organizationId}/receipts`);

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
