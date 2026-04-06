"use server";

import { db, bankTransactions, receipts, transactions } from "@/lib/db";
import { eq, and, sql, desc } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface ReconciliationStatus {
  organizationId: string;
  totalBankTransactions: number;
  unreconciledBankTransactions: number;
  reconciledBankTransactions: number;
  totalReceipts: number;
  verifiedReceipts: number;
  unreconciledReceipts: number;
  matchedReceipts: number;
  unmatchedReceipts: number;
  reconciliationProgress: number;
  recentActivity: Array<{
    date: Date;
    type: string;
    description: string;
  }>;
}

/**
 * Get overall reconciliation status for an organization
 */
export async function getReconciliationStatus(
  organizationId: string,
  dateRange?: { from: Date; to: Date }
): Promise<ApiResponse<ReconciliationStatus>> {
  try {
    // Build conditions for date range
    const bankConditions = [
      eq(bankTransactions.organizationId, organizationId),
    ];

    const receiptConditions = [
      eq(receipts.organizationId, organizationId),
      eq(receipts.status, "verified"),
    ];

    if (dateRange) {
      bankConditions.push(sql`${bankTransactions.date} >= ${dateRange.from}`);
      bankConditions.push(sql`${bankTransactions.date} <= ${dateRange.to}`);
      receiptConditions.push(sql`${receipts.date} >= ${dateRange.from}`);
      receiptConditions.push(sql`${receipts.date} <= ${dateRange.to}`);
    }

    // Get bank transaction counts
    const allBankTx = await db
      .select({ id: bankTransactions.id })
      .from(bankTransactions)
      .where(and(...bankConditions));

    const totalBankTransactions = allBankTx.length;

    const unreconciledBank = await db
      .select({ id: bankTransactions.id })
      .from(bankTransactions)
      .where(
        and(
          ...bankConditions,
          eq(bankTransactions.status, "unreconciled")
        )
      );

    const unreconciledBankTransactions = unreconciledBank.length;
    const reconciledBankTransactions = totalBankTransactions - unreconciledBankTransactions;

    // Get receipt counts
    const allReceipts = await db
      .select({ id: receipts.id })
      .from(receipts)
      .where(and(...receiptConditions));

    const totalReceipts = allReceipts.length;

    // Count matched receipts (receipts that have a linked bank transaction)
    const matchedReceiptsCount = await db
      .select({ id: receipts.id })
      .from(receipts)
      .where(
        and(
          ...receiptConditions,
          sql`${receipts.id} IN (SELECT receipt_id FROM bank_transactions WHERE receipt_id IS NOT NULL)`
        )
      );

    const matchedReceipts = matchedReceiptsCount.length;
    const unreconciledReceipts = totalReceipts - matchedReceipts;

    // Calculate progress
    const totalItemsToReconcile = totalBankTransactions + totalReceipts;
    const reconciliationProgress =
      totalItemsToReconcile > 0
        ? (reconciledBankTransactions + matchedReceipts) / totalItemsToReconcile * 100
        : 100;

    // Get recent reconciliation activity
    const recentTransactions = await db
      .select({
        date: transactions.createdAt,
        description: transactions.description,
        journalType: transactions.journalType,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isReconciled, true)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    const recentActivity = recentTransactions.map((tx) => ({
      date: tx.date!,
      type: tx.journalType,
      description: tx.description,
    }));

    return {
      success: true,
      data: {
        organizationId,
        totalBankTransactions,
        unreconciledBankTransactions,
        reconciledBankTransactions,
        totalReceipts,
        verifiedReceipts: totalReceipts, // All in our query are verified
        unreconciledReceipts,
        matchedReceipts,
        unmatchedReceipts: unreconciledReceipts,
        reconciliationProgress,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("Get reconciliation status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reconciliation status",
    };
  }
}

/**
 * Get detailed reconciliation report by date range
 */
export async function getReconciliationReport(
  organizationId: string,
  dateRange: { from: Date; to: Date }
): Promise<ApiResponse<{
  period: { from: Date; to: Date };
  summary: {
    totalBankTransactions: number;
    totalAmount: number;
    totalDebits: number;
    totalCredits: number;
    reconciledCount: number;
    unreconciledCount: number;
    reconciliationRate: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    totalAmount: number;
    reconciledCount: number;
  }>;
  dailyBreakdown: Array<{
    date: Date;
    transactionCount: number;
    reconciledCount: number;
    totalAmount: number;
  }>;
}>> {
  try {
    // Get all bank transactions in the period
    const allTransactions = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          sql`${bankTransactions.date} >= ${dateRange.from}`,
          sql`${bankTransactions.date} <= ${dateRange.to}`
        )
      )
      .orderBy(bankTransactions.date);

    // Calculate summary
    let totalAmount = 0;
    let totalDebits = 0;
    let totalCredits = 0;
    let reconciledCount = 0;

    allTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      totalAmount += amount;

      if (amount < 0) {
        totalDebits += Math.abs(amount);
      } else {
        totalCredits += amount;
      }

      if (tx.isReconciled) {
        reconciledCount++;
      }
    });

    const totalBankTransactions = allTransactions.length;
    const unreconciledCount = totalBankTransactions - reconciledCount;
    const reconciliationRate =
      totalBankTransactions > 0 ? (reconciledCount / totalBankTransactions) * 100 : 100;

    // Group by category
    const categoryMap = new Map<
      string,
      { count: number; totalAmount: number; reconciledCount: number }
    >();

    allTransactions.forEach((tx) => {
      const category = tx.categoryId || "Uncategorized";
      const amount = Math.abs(Number(tx.amount) || 0);

      const existing = categoryMap.get(category) || {
        count: 0,
        totalAmount: 0,
        reconciledCount: 0,
      };

      existing.count++;
      existing.totalAmount += amount;
      if (tx.isReconciled) {
        existing.reconciledCount++;
      }

      categoryMap.set(category, existing);
    });

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        totalAmount: data.totalAmount,
        reconciledCount: data.reconciledCount,
      })
    );

    // Daily breakdown
    const dailyMap = new Map<
      string,
      { transactionCount: number; reconciledCount: number; totalAmount: number }
    >();

    allTransactions.forEach((tx) => {
      const dateKey = tx.date!.toISOString().split("T")[0]; // YYYY-MM-DD
      const amount = Math.abs(Number(tx.amount) || 0);

      const existing = dailyMap.get(dateKey) || {
        transactionCount: 0,
        reconciledCount: 0,
        totalAmount: 0,
      };

      existing.transactionCount++;
      existing.totalAmount += amount;
      if (tx.isReconciled) {
        existing.reconciledCount++;
      }

      dailyMap.set(dateKey, existing);
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(
      ([dateStr, data]) => ({
        date: new Date(dateStr),
        ...data,
      })
    );

    return {
      success: true,
      data: {
        period: dateRange,
        summary: {
          totalBankTransactions,
          totalAmount,
          totalDebits,
          totalCredits,
          reconciledCount,
          unreconciledCount,
          reconciliationRate,
        },
        byCategory,
        dailyBreakdown,
      },
    };
  } catch (error) {
    console.error("Get reconciliation report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reconciliation report",
    };
  }
}

/**
 * Get unreconciled items for manual review
 */
export async function getUnreconciledItems(
  organizationId: string,
  limit = 50
): Promise<ApiResponse<{
  bankTransactions: any[];
  receipts: any[];
  suggestions: {
    totalPotentialMatches: number;
    highConfidenceMatches: number;
  };
}>> {
  try {
    // Get unreconciled bank transactions
    const unreconciledBank = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          eq(bankTransactions.status, "unreconciled")
        )
      )
      .orderBy(desc(bankTransactions.date))
      .limit(limit);

    // Get unreconciled verified receipts
    const unreconciledReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.organizationId, organizationId),
          eq(receipts.status, "verified"),
          sql`${receipts.id} NOT IN (SELECT receipt_id FROM bank_transactions WHERE receipt_id IS NOT NULL)`
        )
      )
      .orderBy(desc(receipts.date))
      .limit(limit);

    // Get potential match count (from match.ts logic would be here)
    // For now, we'll just estimate
    const totalPotentialMatches = Math.min(
      unreconciledBank.length,
      unreconciledReceipts.length
    );
    const highConfidenceMatches = Math.floor(totalPotentialMatches * 0.3); // Assume 30% are high confidence

    return {
      success: true,
      data: {
        bankTransactions: unreconciledBank,
        receipts: unreconciledReceipts,
        suggestions: {
          totalPotentialMatches,
          highConfidenceMatches,
        },
      },
    };
  } catch (error) {
    console.error("Get unreconciled items error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unreconciled items",
    };
  }
}

/**
 * Get reconciliation statistics for dashboard
 */
export async function getReconciliationStats(
  organizationId: string
): Promise<ApiResponse<{
  thisMonth: {
    transactions: number;
    reconciled: number;
    rate: number;
  };
  overall: {
    transactions: number;
    reconciled: number;
    rate: number;
  };
  trend: Array<{
    month: string;
    rate: number;
  }>;
}>> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get this month's transactions
    const thisMonthTx = await db
      .select({ isReconciled: bankTransactions.isReconciled })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          sql`${bankTransactions.date} >= ${startOfMonth}`
        )
      );

    const thisMonthTotal = thisMonthTx.length;
    const thisMonthReconciled = thisMonthTx.filter((tx) => tx.isReconciled).length;
    const thisMonthRate =
      thisMonthTotal > 0 ? (thisMonthReconciled / thisMonthTotal) * 100 : 100;

    // Get overall transactions
    const allTx = await db
      .select({ isReconciled: bankTransactions.isReconciled })
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, organizationId));

    const overallTotal = allTx.length;
    const overallReconciled = allTx.filter((tx) => tx.isReconciled).length;
    const overallRate =
      overallTotal > 0 ? (overallReconciled / overallTotal) * 100 : 100;

    // Calculate monthly trend for last 6 months
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTx = await db
        .select({ isReconciled: bankTransactions.isReconciled })
        .from(bankTransactions)
        .where(
          and(
            eq(bankTransactions.organizationId, organizationId),
            sql`${bankTransactions.date} >= ${monthDate}`,
            sql`${bankTransactions.date} <= ${monthEnd}`
          )
        );

      const monthTotal = monthTx.length;
      const monthReconciled = monthTx.filter((tx) => tx.isReconciled).length;
      const monthRate = monthTotal > 0 ? (monthReconciled / monthTotal) * 100 : 100;

      trend.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        rate: monthRate,
      });
    }

    return {
      success: true,
      data: {
        thisMonth: {
          transactions: thisMonthTotal,
          reconciled: thisMonthReconciled,
          rate: thisMonthRate,
        },
        overall: {
          transactions: overallTotal,
          reconciled: overallReconciled,
          rate: overallRate,
        },
        trend,
      },
    };
  } catch (error) {
    console.error("Get reconciliation stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reconciliation stats",
    };
  }
}

/**
 * Export reconciliation data for external systems
 */
export async function exportReconciliationData(
  organizationId: string,
  dateRange: { from: Date; to: Date },
  format: "csv" | "json" = "json"
): Promise<ApiResponse<any>> {
  try {
    // Get reconciled transactions in the period
    const reconciledTx = await db
      .select({
        date: bankTransactions.date,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        reference: bankTransactions.reference,
        receiptId: bankTransactions.receiptId,
        reconciledAt: bankTransactions.reconciledAt,
      })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          eq(bankTransactions.isReconciled, true),
          sql`${bankTransactions.date} >= ${dateRange.from}`,
          sql`${bankTransactions.date} <= ${dateRange.to}`
        )
      )
      .orderBy(bankTransactions.date);

    // Get receipt details for matched receipts
    const receiptIds = reconciledTx
      .map((tx) => tx.receiptId)
      .filter((id): id is string => id !== null);

    const receiptsData = receiptIds.length > 0
      ? await db
          .select()
          .from(receipts)
          .where(sql`${receipts.id} = ANY(${receiptIds}::uuid[])`)
      : [];

    // Combine data
    const exportData = reconciledTx.map((tx) => {
      const receipt = receiptsData.find((r) => r.id === tx.receiptId);
      return {
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        reference: tx.reference,
        receiptId: tx.receiptId,
        vendorName: receipt?.vendorName,
        vendorTpn: receipt?.vendorTpn,
        category: receipt?.category,
        reconciledAt: tx.reconciledAt,
      };
    });

    return {
      success: true,
      data: {
        format,
        dateRange,
        recordCount: exportData.length,
        data: exportData,
      },
    };
  } catch (error) {
    console.error("Export reconciliation data error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export reconciliation data",
    };
  }
}
