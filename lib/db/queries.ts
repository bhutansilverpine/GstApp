import { db } from "./index";
import { accounts, transactions, transactionLines, receipts, bankTransactions, organizations } from "./schema";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";
import type {
  TransactionFilters,
  BankTransactionFilters,
  ReceiptFilters,
  TrialBalanceReport,
  TrialBalanceAccount,
} from "@/types";

// ============================================
// Account Queries
// ============================================

/**
 * Get accounts by organization
 */
export async function getAccountsByOrganization(organizationId: string) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.organizationId, organizationId))
    .orderBy(asc(accounts.code));
}

/**
 * Get account hierarchy
 */
export async function getAccountHierarchy(organizationId: string) {
  const allAccounts = await getAccountsByOrganization(organizationId);

  // Build tree structure
  const accountMap = new Map();
  const rootAccounts: any[] = [];

  allAccounts.forEach((account) => {
    accountMap.set(account.id, { ...account, children: [] });
  });

  allAccounts.forEach((account) => {
    const accountNode = accountMap.get(account.id);
    if (account.parentId) {
      const parent = accountMap.get(account.parentId);
      if (parent) {
        parent.children.push(accountNode);
      }
    } else {
      rootAccounts.push(accountNode);
    }
  });

  return rootAccounts;
}

/**
 * Get accounts by type
 */
export async function getAccountsByType(organizationId: string, type: string) {
  return db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.type, type as any)
      )
    )
    .orderBy(asc(accounts.code));
}

// ============================================
// Transaction Queries
// ============================================

/**
 * Get transactions with filters
 */
export async function getTransactions(organizationId: string, filters?: TransactionFilters) {
  const conditions = [eq(transactions.organizationId, organizationId)];

  if (filters?.dateRange) {
    conditions.push(gte(transactions.date, filters.dateRange.from));
    conditions.push(lte(transactions.date, filters.dateRange.to));
  }

  if (filters?.journalType) {
    conditions.push(eq(transactions.journalType, filters.journalType));
  }

  if (filters?.isReconciled !== undefined) {
    conditions.push(eq(transactions.isReconciled, filters.isReconciled));
  }

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date));
}

/**
 * Get transaction with lines
 */
export async function getTransactionWithLines(transactionId: string) {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transaction) return null;

  const lines = await db
    .select()
    .from(transactionLines)
    .where(eq(transactionLines.transactionId, transactionId));

  return { ...transaction, lines };
}

/**
 * Get transaction balance
 */
export async function getTransactionBalance(transactionId: string) {
  const [result] = await db
    .select({
      debits: sql<number>`COALESCE(SUM(${transactionLines.debit}), 0)`,
      credits: sql<number>`COALESCE(SUM(${transactionLines.credit}), 0)`,
    })
    .from(transactionLines)
    .where(eq(transactionLines.transactionId, transactionId));

  return {
    transactionId,
    debits: Number(result.debits),
    credits: Number(result.credits),
    isBalanced: Math.abs(Number(result.debits) - Number(result.credits)) < 0.01,
  };
}

// ============================================
// Receipt Queries
// ============================================

/**
 * Get receipts with filters
 */
export async function getReceipts(organizationId: string, filters?: ReceiptFilters) {
  const conditions = [eq(receipts.organizationId, organizationId)];

  if (filters?.dateRange) {
    conditions.push(gte(receipts.date, filters.dateRange.from));
    conditions.push(lte(receipts.date, filters.dateRange.to));
  }

  if (filters?.status) {
    conditions.push(eq(receipts.status, filters.status));
  }

  if (filters?.vendorTpn) {
    conditions.push(eq(receipts.vendorTpn, filters.vendorTpn));
  }

  return db
    .select()
    .from(receipts)
    .where(and(...conditions))
    .orderBy(desc(receipts.date));
}

/**
 * Get pending receipts
 */
export async function getPendingReceipts(organizationId: string) {
  return db
    .select()
    .from(receipts)
    .where(
      and(
        eq(receipts.organizationId, organizationId),
        eq(receipts.status, "pending")
      )
    )
    .orderBy(desc(receipts.date));
}

// ============================================
// Bank Transaction Queries
// ============================================

/**
 * Get bank transactions with filters
 */
export async function getBankTransactions(organizationId: string, filters?: BankTransactionFilters) {
  const conditions = [eq(bankTransactions.organizationId, organizationId)];

  if (filters?.dateRange) {
    conditions.push(gte(bankTransactions.date, filters.dateRange.from));
    conditions.push(lte(bankTransactions.date, filters.dateRange.to));
  }

  if (filters?.status) {
    conditions.push(eq(bankTransactions.status, filters.status));
  }

  if (filters?.categoryId) {
    conditions.push(eq(bankTransactions.categoryId, filters.categoryId));
  }

  return db
    .select()
    .from(bankTransactions)
    .where(and(...conditions))
    .orderBy(desc(bankTransactions.date));
}

/**
 * Get unreconciled bank transactions
 */
export async function getUnreconciledBankTransactions(organizationId: string) {
  return db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.organizationId, organizationId),
        eq(bankTransactions.status, "unreconciled")
      )
    )
    .orderBy(desc(bankTransactions.date));
}

// ============================================
// Report Queries
// ============================================

/**
 * Generate trial balance
 */
export async function getTrialBalance(organizationId: string, asOfDate: Date): Promise<TrialBalanceReport> {
  // Get all account balances
  const accountBalances = await db
    .select({
      accountId: accounts.id,
      accountCode: accounts.code,
      accountName: accounts.name,
      accountType: accounts.type,
      debit: sql<number>`COALESCE(SUM(${transactionLines.debit}), 0)`,
      credit: sql<number>`COALESCE(SUM(${transactionLines.credit}), 0)`,
    })
    .from(accounts)
    .leftJoin(transactionLines, eq(accounts.id, transactionLines.accountId))
    .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.isActive, true),
        lte(transactions.date, asOfDate)
      )
    )
    .groupBy(accounts.id, accounts.code, accounts.name, accounts.type);

  const trialBalanceAccounts: TrialBalanceAccount[] = accountBalances.map((acc) => ({
    accountId: acc.accountId,
    accountCode: acc.accountCode,
    accountName: acc.accountName,
    accountType: acc.accountType as any,
    debit: Number(acc.debit),
    credit: Number(acc.credit),
    balance: Number(acc.debit) - Number(acc.credit),
  }));

  const totalDebits = trialBalanceAccounts.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((sum, acc) => sum + acc.credit, 0);

  return {
    organizationId,
    asOfDate,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    accounts: trialBalanceAccounts,
  };
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(organizationId: string) {
  const [transactionCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.organizationId, organizationId));

  const [accountCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(accounts)
    .where(eq(accounts.organizationId, organizationId));

  const [receiptCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(receipts)
    .where(eq(receipts.organizationId, organizationId));

  const [pendingReceipts] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(receipts)
    .where(
      and(
        eq(receipts.organizationId, organizationId),
        eq(receipts.status, "pending")
      )
    );

  return {
    transactionCount: Number(transactionCount?.count || 0),
    accountCount: Number(accountCount?.count || 0),
    receiptCount: Number(receiptCount?.count || 0),
    pendingReceipts: Number(pendingReceipts?.count || 0),
  };
}

// ============================================
// Utility Queries
// ============================================

/**
 * Search accounts by name or code
 */
export async function searchAccounts(organizationId: string, query: string) {
  return db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.organizationId, organizationId),
        sql`${accounts.name} ILIKE ${`%${query}%`} OR ${accounts.code} ILIKE ${`%${query}%`}`
      )
    )
    .orderBy(asc(accounts.code))
    .limit(20);
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(organizationId: string, limit: number = 10) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.organizationId, organizationId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}