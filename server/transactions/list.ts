"use server";

import { db, transactions, transactionLines, accounts } from "@/lib/db";
import { eq, and, desc, like, or, gte, lte } from "drizzle-orm";
import type { ApiResponse, TransactionFilters, PaginatedResponse } from "@/types";

interface ListTransactionsOptions {
  organizationId: string;
  filters?: TransactionFilters;
  page?: number;
  limit?: number;
}

/**
 * List transactions with filtering and pagination
 */
export async function listTransactions({
  organizationId,
  filters,
  page = 1,
  limit = 20,
}: ListTransactionsOptions): Promise<ApiResponse<PaginatedResponse<any>>> {
  try {
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(transactions.organizationId, organizationId)];

    if (filters) {
      // Journal type filter
      if (filters.journalType) {
        conditions.push(eq(transactions.journalType, filters.journalType));
      }

      // Reconciled filter
      if (filters.isReconciled !== undefined) {
        conditions.push(eq(transactions.isReconciled, filters.isReconciled));
      }

      // Date range filter
      if (filters.dateRange) {
        conditions.push(gte(transactions.date, filters.dateRange.from));
        conditions.push(lte(transactions.date, filters.dateRange.to));
      }

      // Account filter (needs to join with transaction lines)
      if (filters.accountId) {
        // Get transaction IDs that have lines for this account
        const accountLines = await db
          .select({ transactionId: transactionLines.transactionId })
          .from(transactionLines)
          .where(eq(transactionLines.accountId, filters.accountId));

        const transactionIds = accountLines.map((l) => l.transactionId);
        if (transactionIds.length > 0) {
          // Add condition for transaction ID
          conditions.push(
            sql`${transactions.id} = ANY(${transactionIds}::uuid[])`
          );
        }
      }

      // Search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            like(transactions.description, searchTerm),
            like(transactions.reference, searchTerm)
          )!
        );
      }
    }

    // Get total count
    const { count } = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions))[0];

    // Get transactions with pagination
    const transactionList = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    // Get transaction lines for each transaction
    const transactionsWithLines = await Promise.all(
      transactionList.map(async (transaction) => {
        const lines = await db
          .select({
            id: transactionLines.id,
            accountId: transactionLines.accountId,
            accountCode: accounts.code,
            accountName: accounts.name,
            accountType: accounts.type,
            description: transactionLines.description,
            debit: transactionLines.debit,
            credit: transactionLines.credit,
          })
          .from(transactionLines)
          .innerJoin(accounts, eq(transactionLines.accountId, accounts.id))
          .where(eq(transactionLines.transactionId, transaction.id));

        return {
          ...transaction,
          lines,
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: transactionsWithLines,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    };
  } catch (error) {
    console.error("List transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list transactions",
    };
  }
}

/**
 * Get transaction by ID with full details
 */
export async function getTransaction(
  transactionId: string,
  organizationId: string
): Promise<ApiResponse<any>> {
  try {
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

    // Get transaction lines with account details
    const lines = await db
      .select({
        id: transactionLines.id,
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        description: transactionLines.description,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .innerJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(eq(transactionLines.transactionId, transactionId));

    const transactionWithLines = {
      ...transaction,
      lines,
    };

    return {
      success: true,
      data: transactionWithLines,
    };
  } catch (error) {
    console.error("Get transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transaction",
    };
  }
}

/**
 * Get transactions by journal type
 */
export async function getTransactionsByJournalType(
  organizationId: string,
  journalType: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    const transactionList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.journalType, journalType as any)
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit);

    return {
      success: true,
      data: transactionList,
    };
  } catch (error) {
    console.error("Get transactions by journal type error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions by journal type",
    };
  }
}

/**
 * Get posted transactions
 */
export async function getPostedTransactions(
  organizationId: string,
  limit = 100
): Promise<ApiResponse<any[]>> {
  try {
    const postedTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, true)
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit);

    return {
      success: true,
      data: postedTransactions,
    };
  } catch (error) {
    console.error("Get posted transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get posted transactions",
    };
  }
}

/**
 * Get unposted transactions
 */
export async function getUnpostedTransactions(
  organizationId: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    const unpostedTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, false)
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit);

    return {
      success: true,
      data: unpostedTransactions,
    };
  } catch (error) {
    console.error("Get unposted transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unposted transactions",
    };
  }
}

/**
 * Search transactions
 */
export async function searchTransactions(
  organizationId: string,
  searchTerm: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    const searchPattern = `%${searchTerm}%`;

    const foundTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          or(
            like(transactions.description, searchPattern),
            like(transactions.reference, searchPattern)
          )!
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit);

    return {
      success: true,
      data: foundTransactions,
    };
  } catch (error) {
    console.error("Search transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search transactions",
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
    const transactionList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          gte(transactions.date, fromDate),
          lte(transactions.date, toDate)
        )
      )
      .orderBy(desc(transactions.date));

    return {
      success: true,
      data: transactionList,
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
 * Get transactions summary for dashboard
 */
export async function getTransactionsSummary(
  organizationId: string,
  dateRange?: { from: Date; to: Date }
): Promise<ApiResponse<{
  totalTransactions: number;
  postedTransactions: number;
  unpostedTransactions: number;
  totalDebits: number;
  totalCredits: number;
  byJournalType: Array<{ type: string; count: number }>;
}>> {
  try {
    const conditions = [eq(transactions.organizationId, organizationId)];

    if (dateRange) {
      conditions.push(gte(transactions.date, dateRange.from));
      conditions.push(lte(transactions.date, dateRange.to));
    }

    const allTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions));

    const totalTransactions = allTransactions.length;
    const postedTransactions = allTransactions.filter((t) => t.isPosted).length;
    const unpostedTransactions = totalTransactions - postedTransactions;

    // Get transaction lines for totals
    const transactionIds = allTransactions.map((t) => t.id);
    let totalDebits = 0;
    let totalCredits = 0;

    if (transactionIds.length > 0) {
      const lines = await db
        .select({
          debit: transactionLines.debit,
          credit: transactionLines.credit,
        })
        .from(transactionLines)
        .where(
          sql`${transactionLines.transactionId} = ANY(${transactionIds}::uuid[])`
        );

      totalDebits = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
      totalCredits = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    }

    // Count by journal type
    const journalTypeMap = new Map<string, number>();
    allTransactions.forEach((transaction) => {
      const count = journalTypeMap.get(transaction.journalType) || 0;
      journalTypeMap.set(transaction.journalType, count + 1);
    });

    const byJournalType = Array.from(journalTypeMap.entries()).map(
      ([type, count]) => ({
        type,
        count,
      })
    );

    return {
      success: true,
      data: {
        totalTransactions,
        postedTransactions,
        unpostedTransactions,
        totalDebits,
        totalCredits,
        byJournalType,
      },
    };
  } catch (error) {
    console.error("Get transactions summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions summary",
    };
  }
}

/**
 * Get account activity (transactions affecting a specific account)
 */
export async function getAccountActivity(
  organizationId: string,
  accountId: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    // Get transaction lines for this account
    const lines = await db
      .select({
        transactionId: transactionLines.transactionId,
        accountId: transactionLines.accountId,
        description: transactionLines.description,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
        date: transactions.date,
        transactionDescription: transactions.description,
        reference: transactions.reference,
        journalType: transactions.journalType,
      })
      .from(transactionLines)
      .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactionLines.accountId, accountId)
        )
      )
      .orderBy(desc(transactions.date))
      .limit(limit);

    return {
      success: true,
      data: lines,
    };
  } catch (error) {
    console.error("Get account activity error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get account activity",
    };
  }
}
