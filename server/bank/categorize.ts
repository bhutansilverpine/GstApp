"use server";

import { revalidatePath } from "next/cache";
import { db, bankTransactions, accounts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import type { ApiResponse } from "@/types";
import { 
  categorizeTransaction, 
  extractPaymentMode, 
  extractAccountNumber, 
  extractMerchantName, 
} from "@/lib/bank-utils";

/**
 * Re-exporting utility functions as async server actions (if needed externally)
 * but it's better to import them directly from lib/bank-utils where possible.
 */
export async function categorizeTransactionAction(description: string): Promise<string> {
  return categorizeTransaction(description);
}

export async function extractPaymentModeAction(description: string): Promise<string> {
  return extractPaymentMode(description);
}

export async function extractAccountNumberAction(description: string): Promise<string> {
  return extractAccountNumber(description);
}

export async function extractMerchantNameAction(description: string): Promise<string> {
  return extractMerchantName(description);
}

/**
 * Auto-categorize uncategorized bank transactions
 */
export async function autoCategorizeTransactions(
  organizationId: string
): Promise<ApiResponse<{ categorized: number; skipped: number }>> {
  try {
    // Get uncategorized transactions
    const uncategorizedTransactions = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          eq(bankTransactions.status, "unreconciled")
        )
      )
      .orderBy(desc(bankTransactions.date));

    let categorized = 0;
    let skipped = 0;

    for (const transaction of uncategorizedTransactions) {
      if (!transaction.description) {
        skipped++;
        continue;
      }

      // Extract transaction details
      const category = categorizeTransaction(transaction.description);
      const paymentMode = extractPaymentMode(transaction.description);
      const accountNumber = extractAccountNumber(transaction.description);
      const merchant = extractMerchantName(transaction.description);

      // Update transaction with extracted data
      await db
        .update(bankTransactions)
        .set({
          notes: `Auto-categorized as: ${category} | Mode: ${paymentMode}`,
          rawData: {
            ...((transaction.rawData as any) || {}),
            code: paymentMode,
            particulars: transaction.description,
            merchant: merchant,
            accountNumber: accountNumber,
          },
        })
        .where(eq(bankTransactions.id, transaction.id));

      categorized++;
    }

    console.log(
      `Auto-categorized ${categorized} transactions, skipped ${skipped}`
    );

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/bank`);
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);

    return {
      success: true,
      data: { categorized, skipped },
    };
  } catch (error) {
    console.error("Auto-categorization error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to auto-categorize transactions",
    };
  }
}

/**
 * Manually categorize a transaction
 */
export async function categorizeTransactionManual(
  transactionId: string,
  organizationId: string,
  categoryId: string,
  notes?: string
): Promise<ApiResponse<any>> {
  try {
    const updatedTransactions = await db
      .update(bankTransactions)
      .set({
        categoryId,
        notes: notes || "Manually categorized",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bankTransactions.id, transactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .returning();

    if (!updatedTransactions.length) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    console.log(`Categorized transaction ${transactionId} as ${categoryId}`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/bank`);
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);

    return {
      success: true,
      data: updatedTransactions[0],
    };
  } catch (error) {
    console.error("Manual categorization error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to categorize transaction",
    };
  }
}

/**
 * Batch categorize multiple transactions
 */
export async function batchCategorizeTransactions(
  transactionIds: string[],
  organizationId: string,
  categoryId: string
): Promise<ApiResponse<{ categorized: number }>> {
  try {
    let categorized = 0;

    for (const transactionId of transactionIds) {
      const result = await categorizeTransactionManual(
        transactionId,
        organizationId,
        categoryId,
        "Batch categorized"
      );

      if (result.success) {
        categorized++;
      }
    }

    console.log(`Batch categorized ${categorized} transactions`);

    return {
      success: true,
      data: { categorized },
    };
  } catch (error) {
    console.error("Batch categorization error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to batch categorize transactions",
    };
  }
}

/**
 * Get categorization statistics
 */
export async function getCategorizationStats(
  organizationId: string
): Promise<ApiResponse<{
  total: number;
  categorized: number;
  uncategorized: number;
  byCategory: Array<{ category: string; count: number }>;
}>> {
  try {
    const allTransactions = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, organizationId));

    const total = allTransactions.length;
    const categorized = allTransactions.filter((t) => t.categoryId).length;
    const uncategorized = total - categorized;

    // Count by category
    const categoryMap = new Map<string, number>();

    for (const transaction of allTransactions) {
      if (transaction.categoryId) {
        const count = categoryMap.get(transaction.categoryId) || 0;
        categoryMap.set(transaction.categoryId, count + 1);
      }
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    return {
      success: true,
      data: {
        total,
        categorized,
        uncategorized,
        byCategory,
      },
    };
  } catch (error) {
    console.error("Get categorization stats error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get categorization stats",
    };
  }
}


