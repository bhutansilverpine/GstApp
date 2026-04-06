"use server";

import { revalidatePath } from "next/cache";
import { db, bankTransactions, accounts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface CategorizationRule {
  keywords: string[];
  category: string;
  priority: number;
}

interface CategoryMapping {
  [key: string]: string;
}

/**
 * Categorization rules for bank transactions
 * Organized by priority (higher priority = checked first)
 */
const CATEGORIZATION_RULES: CategorizationRule[] = [
  // High priority - Specific merchants/types
  {
    keywords: ["LUNGYEN", "DAMCHEN", "PUMP", "PETROL", "FUEL STATION"],
    category: "FUEL",
    priority: 10,
  },
  {
    keywords: ["RESTAURANT", "CAFE", "HOTEL", "BAKERY", "ZOMATO", "FOOD"],
    category: "FOOD",
    priority: 9,
  },
  {
    keywords: ["PHARMACY", "HOSPITAL", "CLINIC", "MEDICAL", "DOCTOR"],
    category: "HEALTH",
    priority: 8,
  },
  {
    keywords: ["SCHOOL", "COLLEGE", "EDUCATION", "TUITION"],
    category: "EDUCATION",
    priority: 7,
  },
  // Medium priority - General categories
  {
    keywords: ["MALL", "MART", "STORE", "SHOP", "SUPERMARKET", "GROCERY"],
    category: "SHOPPING",
    priority: 5,
  },
  {
    keywords: ["TASHI", "BTL", "RECHARGE", "BILL", "RICB", "POWER", "ELECTRIC"],
    category: "UTILITY",
    priority: 5,
  },
  {
    keywords: ["TAXI", "CAB", "BUS", "TRAVEL", "TRANSPORT"],
    category: "TRANSPORT",
    priority: 5,
  },
  {
    keywords: ["OFFICE", "SUPPLY", "STATIONERY", "PRINT", "XEROX"],
    category: "OFFICE SUPPLIES",
    priority: 4,
  },
  // Low priority - Generic patterns
  {
    keywords: ["GPAY", "MBANK", "QR-PAY", "UPI"],
    category: "DIGITAL PAYMENT",
    priority: 2,
  },
  {
    keywords: ["ATM", "CASH"],
    category: "CASH WITHDRAWAL",
    priority: 2,
  },
  {
    keywords: ["TRANSFER", "NEFT", "RTGS", "IMPS"],
    category: "BANK TRANSFER",
    priority: 2,
  },
];

/**
 * Payment mode patterns
 */
const PAYMENT_MODES: { [key: string]: string } = {
  GPAY: "GPAY",
  "M-BOB": "M-BOB",
  MBANK: "M-BOB",
  NQRC: "QR-PAY",
  UPI: "UPI",
  ATM: "CASH",
  POS: "CARD",
  "BT-POS": "CARD",
  INDO: "INDO-TRANS",
  CHEQUE: "CHEQUE",
};

/**
 * Auto-categorize a single transaction based on description
 */
export function categorizeTransaction(description: string): string {
  const upperDesc = description.toUpperCase();

  // Sort rules by priority (highest first)
  const sortedRules = [...CATEGORIZATION_RULES].sort(
    (a, b) => b.priority - a.priority
  );

  // Check each rule
  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (upperDesc.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "MISC/PERSONAL";
}

/**
 * Extract payment mode from transaction description
 */
export function extractPaymentMode(description: string): string {
  const upperDesc = description.toUpperCase();

  for (const [key, value] of Object.entries(PAYMENT_MODES)) {
    if (upperDesc.includes(key)) {
      return value;
    }
  }

  return "OTHER";
}

/**
 * Extract account/mobile number from description
 */
export function extractAccountNumber(description: string): string {
  // Match 8-12 digit numbers
  const match = description.match(/\d{8,12}/);
  return match ? match[0] : "";
}

/**
 * Clean and extract merchant name from description
 */
export function extractMerchantName(description: string): string {
  let merchant = description.toUpperCase();

  // Remove common patterns
  const removalPatterns = [
    "OUTGOING PAYMENT VIA",
    "INCOMING PAYMENT VIA",
    "TRANSFER FROM",
    "TRANSFER TO",
    "BY",
    "FROM",
    "TO",
    "NEFT",
    "RTGS",
    "IMPS",
    "RRN",
    "REF",
    "REFERENCE",
  ];

  removalPatterns.forEach((pattern) => {
    const regex = new RegExp(pattern, "gi");
    merchant = merchant.replace(regex, "");
  });

  // Remove account numbers
  merchant = merchant.replace(/\d{8,12}/g, "");

  // Clean up separators and extra spaces
  merchant = merchant
    .replace(/[|,\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit length
  return merchant.substring(0, 40);
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
 * Get category suggestions for a transaction
 */
export function getCategorySuggestions(
  description: string
): Array<{ category: string; confidence: number }> {
  const upperDesc = description.toUpperCase();
  const suggestions: Array<{ category: string; confidence: number }> = [];

  // Sort rules by priority
  const sortedRules = [...CATEGORIZATION_RULES].sort(
    (a, b) => b.priority - a.priority
  );

  // Check each rule and calculate confidence
  for (const rule of sortedRules) {
    let matchCount = 0;
    for (const keyword of rule.keywords) {
      if (upperDesc.includes(keyword)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / rule.keywords.length, 1);
      suggestions.push({
        category: rule.category,
        confidence: confidence * rule.priority * 0.1, // Weight by priority
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Return top 5 suggestions
  return suggestions.slice(0, 5);
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
