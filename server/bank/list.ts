"use server";

import { db, bankTransactions } from "@/lib/db";
import { eq, and, desc, like, or, gte, lte, sql } from "drizzle-orm";
import type { ApiResponse, BankTransactionFilters, PaginatedResponse } from "@/types";

interface ListBankTransactionsOptions {
  organizationId: string;
  filters?: BankTransactionFilters;
  page?: number;
  limit?: number;
}

/**
 * List bank transactions with filtering and pagination
 */
export async function listBankTransactions({
  organizationId,
  filters,
  page = 1,
  limit = 20,
}: ListBankTransactionsOptions): Promise<ApiResponse<any>> {
  try {
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(bankTransactions.organizationId, organizationId)];

    if (filters) {
      // Status filter
      if (filters.status) {
        conditions.push(eq(bankTransactions.status, filters.status));
      }

      // Category filter
      if (filters.categoryId) {
        conditions.push(eq(bankTransactions.categoryId, filters.categoryId));
      }

      // Date range filter
      if (filters.dateRange) {
        conditions.push(gte(bankTransactions.date, filters.dateRange.from));
        conditions.push(lte(bankTransactions.date, filters.dateRange.to));
      }

      // Amount range filter
      if (filters.amountRange) {
        conditions.push(
          sql`${bankTransactions.amount} >= ${filters.amountRange.from}`
        );
        conditions.push(
          sql`${bankTransactions.amount} <= ${filters.amountRange.to}`
        );
      }

      // Search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            like(bankTransactions.description, searchTerm),
            like(bankTransactions.reference, searchTerm)
          )!
        );
      }
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bankTransactions)
      .where(and(...conditions));

    const count = countResult[0]?.count || 0;

    // Get transactions with pagination
    const transactionList = await db
      .select()
      .from(bankTransactions)
      .where(and(...conditions))
      .orderBy(desc(bankTransactions.date))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: {
        transactions: transactionList,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
    };
  } catch (error) {
    console.error("List bank transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list bank transactions",
    };
  }
}

/**
 * Get bank transaction by ID
 */
export async function getBankTransaction(
  transactionId: string,
  organizationId: string
): Promise<ApiResponse<any>> {
  try {
    const transactionList = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, transactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!transactionList.length) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    return {
      success: true,
      data: transactionList[0],
    };
  } catch (error) {
    console.error("Get bank transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get bank transaction",
    };
  }
}

/**
 * Get bank transactions summary for dashboard
 */
export async function getBankTransactionsSummary(
  organizationId: string,
  dateRange?: { from: Date; to: Date }
): Promise<ApiResponse<{
  totalTransactions: number;
  unreconciledTransactions: number;
  reconciledTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netCashFlow: number;
}>> {
  try {
    const conditions = [eq(bankTransactions.organizationId, organizationId)];

    if (dateRange) {
      conditions.push(gte(bankTransactions.date, dateRange.from));
      conditions.push(lte(bankTransactions.date, dateRange.to));
    }

    const allTransactions = await db
      .select()
      .from(bankTransactions)
      .where(and(...conditions));

    const totalTransactions = allTransactions.length;
    const unreconciledTransactions = allTransactions.filter(
      (t) => t.status === "unreconciled"
    ).length;
    const reconciledTransactions = allTransactions.filter(
      (t) => t.status === "reconciled"
    ).length;

    let totalDebits = 0;
    let totalCredits = 0;

    allTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount || 0);
      if (amount < 0) {
        totalDebits += Math.abs(amount);
      } else {
        totalCredits += amount;
      }
    });

    const netCashFlow = totalCredits - totalDebits;

    return {
      success: true,
      data: {
        totalTransactions,
        unreconciledTransactions,
        reconciledTransactions,
        totalDebits,
        totalCredits,
        netCashFlow,
      },
    };
  } catch (error) {
    console.error("Get bank transactions summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get bank transactions summary",
    };
  }
}

/**
 * Get unreconciled bank transactions (for reconciliation)
 */
export async function getUnreconciledTransactions(
  organizationId: string,
  limit = 100
): Promise<ApiResponse<any[]>> {
  try {
    const unreconciledList = await db
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

    return {
      success: true,
      data: unreconciledList,
    };
  } catch (error) {
    console.error("Get unreconciled transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unreconciled transactions",
    };
  }
}

/**
 * Search bank transactions by multiple criteria
 */
export async function searchBankTransactions(
  organizationId: string,
  searchTerm: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    const searchPattern = `%${searchTerm}%`;

    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          or(
            like(bankTransactions.description, searchPattern),
            like(bankTransactions.reference, searchPattern),
            like(bankTransactions.transactionType, searchPattern)
          )!
        )
      )
      .orderBy(desc(bankTransactions.date))
      .limit(limit);

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    console.error("Search bank transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search bank transactions",
    };
  }
}

/**
 * Get transactions by date range
 */
export async function getTransactionsByDateRange(
  organizationId: string,
  fromDate: Date,
  toDate: Date
): Promise<ApiResponse<any[]>> {
  try {
    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          gte(bankTransactions.date, fromDate),
          lte(bankTransactions.date, toDate)
        )
      )
      .orderBy(desc(bankTransactions.date));

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    console.error("Get transactions by date range error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions by date range",
    };
  }
}

/**
 * Get cash flow analysis
 */
export async function getCashFlowAnalysis(
  organizationId: string,
  dateRange: { from: Date; to: Date }
): Promise<ApiResponse<{
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  averageDailyInflow: number;
  averageDailyOutflow: number;
  transactionCount: number;
  largestInflow: { amount: number; date: Date; description: string } | null;
  largestOutflow: { amount: number; date: Date; description: string } | null;
}>> {
  try {
    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          gte(bankTransactions.date, dateRange.from),
          lte(bankTransactions.date, dateRange.to)
        )
      )
      .orderBy(desc(bankTransactions.date));

    let totalInflow = 0;
    let totalOutflow = 0;
    let largestInflow: { amount: number; date: Date; description: string } | null = null;
    let largestOutflow: { amount: number; date: Date; description: string } | null = null;

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount || 0);

      if (amount > 0) {
        totalInflow += amount;
        if (!largestInflow || amount > largestInflow.amount) {
          largestInflow = {
            amount,
            date: transaction.date!,
            description: transaction.description,
          };
        }
      } else if (amount < 0) {
        totalOutflow += Math.abs(amount);
        if (!largestOutflow || Math.abs(amount) > largestOutflow.amount) {
          largestOutflow = {
            amount: Math.abs(amount),
            date: transaction.date!,
            description: transaction.description,
          };
        }
      }
    });

    const netFlow = totalInflow - totalOutflow;
    const transactionCount = transactions.length;

    // Calculate days in range
    const daysInPeriod =
      Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      ) || 1;

    const averageDailyInflow = totalInflow / daysInPeriod;
    const averageDailyOutflow = totalOutflow / daysInPeriod;

    return {
      success: true,
      data: {
        totalInflow,
        totalOutflow,
        netFlow,
        averageDailyInflow,
        averageDailyOutflow,
        transactionCount,
        largestInflow,
        largestOutflow,
      },
    };
  } catch (error) {
    console.error("Get cash flow analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get cash flow analysis",
    };
  }
}

/**
 * Update bank transaction notes
 */
export async function updateTransactionNotes(
  transactionId: string,
  organizationId: string,
  notes: string
): Promise<ApiResponse<any>> {
  try {
    const updatedTransactions = await db
      .update(bankTransactions)
      .set({
        notes,
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
        error: "Bank transaction not found",
      };
    }

    return {
      success: true,
      data: updatedTransactions[0],
    };
  } catch (error) {
    console.error("Update transaction notes error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update transaction notes",
    };
  }
}

/**
 * Flag transaction for review
 */
export async function flagTransaction(
  transactionId: string,
  organizationId: string,
  reason: string
): Promise<ApiResponse<any>> {
  try {
    const updatedTransactions = await db
      .update(bankTransactions)
      .set({
        status: "flagged",
        notes: reason,
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
        error: "Bank transaction not found",
      };
    }

    return {
      success: true,
      data: updatedTransactions[0],
    };
  } catch (error) {
    console.error("Flag transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to flag transaction",
    };
  }
}
