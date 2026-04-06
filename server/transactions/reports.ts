"use server";

import { db, transactions, transactionLines, accounts, organizations } from "@/lib/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import type { ApiResponse, TrialBalanceReport, IncomeStatement, BalanceSheet } from "@/types";

/**
 * Generate Trial Balance Report
 * Shows account balances with debit and credit columns
 */
export async function generateTrialBalance(
  organizationId: string,
  asOfDate: Date
): Promise<ApiResponse<TrialBalanceReport>> {
  try {
    // Verify organization exists
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

    // Get all posted transactions up to the specified date
    const postedTransactions = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, true),
          lte(transactions.date, asOfDate)
        )
      );

    const transactionIds = postedTransactions.map((t) => t.id);

    if (transactionIds.length === 0) {
      return {
        success: true,
        data: {
          organizationId,
          asOfDate,
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: true,
          accounts: [],
        },
      };
    }

    // Get all transaction lines for these transactions
    const lines = await db
      .select({
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .where(
        sql`${transactionLines.transactionId} = ANY(${transactionIds}::uuid[])`
      );

    // Aggregate by account
    const accountBalances = new Map<string, { debit: number; credit: number }>();

    lines.forEach((line) => {
      const accountId = line.accountId;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      const existing = accountBalances.get(accountId) || { debit: 0, credit: 0 };
      accountBalances.set(accountId, {
        debit: existing.debit + debit,
        credit: existing.credit + credit,
      });
    });

    // Get account details and calculate balances
    const accountIds = Array.from(accountBalances.keys());
    const accountDetails = await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        sql`${accounts.id} = ANY(${accountIds}::uuid[])`
      );

    const trialBalanceAccounts = await Promise.all(
      accountDetails.map(async (account) => {
        const balances = accountBalances.get(account.id)!;
        let debit = balances.debit;
        let credit = balances.credit;
        let balance = 0;

        // Calculate net balance based on account type
        if (account.type === "asset" || account.type === "expense") {
          // Debit balance accounts
          balance = debit - credit;
          if (balance < 0) {
            // Negative balance means credit exceeds debit
            credit = Math.abs(balance);
            debit = 0;
          } else {
            debit = balance;
            credit = 0;
          }
        } else {
          // Credit balance accounts (liability, equity, revenue)
          balance = credit - debit;
          if (balance < 0) {
            // Negative balance means debit exceeds credit
            debit = Math.abs(balance);
            credit = 0;
          } else {
            credit = balance;
            debit = 0;
          }
        }

        return {
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          debit,
          credit,
          balance,
        };
      })
    );

    // Calculate totals
    const totalDebits = trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredits = trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // 1 cent tolerance

    // Sort by account code
    trialBalanceAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      success: true,
      data: {
        organizationId,
        asOfDate,
        totalDebits,
        totalCredits,
        isBalanced,
        accounts: trialBalanceAccounts,
      },
    };
  } catch (error) {
    console.error("Generate trial balance error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate trial balance",
    };
  }
}

/**
 * Generate Income Statement (Profit & Loss)
 * Shows revenue and expenses for a period
 */
export async function generateIncomeStatement(
  organizationId: string,
  period: { from: Date; to: Date }
): Promise<ApiResponse<IncomeStatement>> {
  try {
    // Verify organization exists
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

    // Get posted transactions within the period
    const postedTransactions = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, true),
          gte(transactions.date, period.from),
          lte(transactions.date, period.to)
        )
      );

    const transactionIds = postedTransactions.map((t) => t.id);

    if (transactionIds.length === 0) {
      return {
        success: true,
        data: {
          organizationId,
          period,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
          accounts: [],
        },
      };
    }

    // Get transaction lines for revenue and expense accounts only
    const lines = await db
      .select({
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .where(
        sql`${transactionLines.transactionId} = ANY(${transactionIds}::uuid[])`
      );

    // Get account details
    const accountIds = Array.from(new Set(lines.map((l) => l.accountId)));
    const accountDetails = await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        and(
          sql`${accounts.id} = ANY(${accountIds}::uuid[])`,
          sql`${accounts.type} = ANY(${['revenue', 'expense']}::varchar[])`
        )
      );

    // Calculate balances for each account
    const incomeStatementAccounts = accountDetails.map((account) => {
      const accountLines = lines.filter((l) => l.accountId === account.id);
      let debit = accountLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
      let credit = accountLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
      let balance = 0;

      if (account.type === "revenue") {
        // Revenue accounts: credit increases, debit decreases
        balance = credit - debit;
      } else {
        // Expense accounts: debit increases, credit decreases
        balance = debit - credit;
      }

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        debit,
        credit,
        balance,
      };
    });

    // Calculate totals
    const revenue = incomeStatementAccounts
      .filter((a) => a.accountType === "revenue")
      .reduce((sum, a) => sum + a.balance, 0);

    const expenses = incomeStatementAccounts
      .filter((a) => a.accountType === "expense")
      .reduce((sum, a) => sum + a.balance, 0);

    const netIncome = revenue - expenses;

    return {
      success: true,
      data: {
        organizationId,
        period,
        revenue,
        expenses,
        netIncome,
        accounts: incomeStatementAccounts,
      },
    };
  } catch (error) {
    console.error("Generate income statement error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate income statement",
    };
  }
}

/**
 * Generate Balance Sheet
 * Shows assets, liabilities, and equity as of a date
 */
export async function generateBalanceSheet(
  organizationId: string,
  asOfDate: Date
): Promise<ApiResponse<BalanceSheet>> {
  try {
    // Verify organization exists
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

    // Get all posted transactions up to the specified date
    const postedTransactions = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, true),
          lte(transactions.date, asOfDate)
        )
      );

    const transactionIds = postedTransactions.map((t) => t.id);

    if (transactionIds.length === 0) {
      return {
        success: true,
        data: {
          organizationId,
          asOfDate,
          assets: 0,
          liabilities: 0,
          equity: 0,
          accounts: [],
        },
      };
    }

    // Get all transaction lines
    const lines = await db
      .select({
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .where(
        sql`${transactionLines.transactionId} = ANY(${transactionIds}::uuid[])`
      );

    // Get account details for balance sheet accounts (assets, liabilities, equity)
    const accountIds = Array.from(new Set(lines.map((l) => l.accountId)));
    const accountDetails = await db
      .select({
        id: accounts.id,
        code: accounts.code,
        name: accounts.name,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        and(
          sql`${accounts.id} = ANY(${accountIds}::uuid[])`,
          sql`${accounts.type} = ANY(${['asset', 'liability', 'equity']}::varchar[])`
        )
      );

    // Calculate balances for each account
    const balanceSheetAccounts = accountDetails.map((account) => {
      const accountLines = lines.filter((l) => l.accountId === account.id);
      let debit = accountLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
      let credit = accountLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
      let balance = 0;

      if (account.type === "asset") {
        // Asset accounts: debit increases, credit decreases
        balance = debit - credit;
      } else {
        // Liability and equity accounts: credit increases, debit decreases
        balance = credit - debit;
      }

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        debit,
        credit,
        balance,
      };
    });

    // Calculate totals
    const assets = balanceSheetAccounts
      .filter((a) => a.accountType === "asset")
      .reduce((sum, a) => sum + a.balance, 0);

    const liabilities = balanceSheetAccounts
      .filter((a) => a.accountType === "liability")
      .reduce((sum, a) => sum + a.balance, 0);

    const equity = balanceSheetAccounts
      .filter((a) => a.accountType === "equity")
      .reduce((sum, a) => sum + a.balance, 0);

    return {
      success: true,
      data: {
        organizationId,
        asOfDate,
        assets,
        liabilities,
        equity,
        accounts: balanceSheetAccounts,
      },
    };
  } catch (error) {
    console.error("Generate balance sheet error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate balance sheet",
    };
  }
}

/**
 * Generate GST Report
 * Shows GST collected and paid for a period
 */
export async function generateGSTReport(
  organizationId: string,
  period: { from: Date; to: Date }
): Promise<ApiResponse<{
  organizationId: string;
  period: { from: Date; to: Date };
  gstCollected: number;
  gstPaid: number;
  netGST: number;
  taxableSales: number;
  taxablePurchases: number;
}>> {
  try {
    // Verify organization exists
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

    // Get organization GST rate
    const organization = orgCheck[0];
    const gstRate = Number(organization.gstRate || 15) / 100;

    // Get all posted transactions within the period
    const postedTransactions = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.isPosted, true),
          gte(transactions.date, period.from),
          lte(transactions.date, period.to)
        )
      );

    const transactionIds = postedTransactions.map((t) => t.id);

    if (transactionIds.length === 0) {
      return {
        success: true,
        data: {
          organizationId,
          period,
          gstCollected: 0,
          gstPaid: 0,
          netGST: 0,
          taxableSales: 0,
          taxablePurchases: 0,
        },
      };
    }

    // Get transaction lines for revenue (sales) and expense (purchases) accounts
    const lines = await db
      .select({
        accountId: transactionLines.accountId,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .where(
        sql`${transactionLines.transactionId} = ANY(${transactionIds}::uuid[])`
      );

    // Get account details
    const accountIds = Array.from(new Set(lines.map((l) => l.accountId)));
    const accountDetails = await db
      .select({
        id: accounts.id,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        sql`${accounts.id} = ANY(${accountIds}::uuid[])`
      );

    // Calculate sales and purchases
    let taxableSales = 0;
    let taxablePurchases = 0;

    lines.forEach((line) => {
      const account = accountDetails.find((a) => a.id === line.accountId);
      if (!account) return;

      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (account.type === "revenue") {
        // Revenue accounts: credit balance represents sales
        taxableSales += credit - debit;
      } else if (account.type === "expense") {
        // Expense accounts: debit balance represents purchases
        taxablePurchases += debit - credit;
      }
    });

    // Calculate GST
    const gstCollected = taxableSales * gstRate;
    const gstPaid = taxablePurchases * gstRate;
    const netGST = gstCollected - gstPaid;

    return {
      success: true,
      data: {
        organizationId,
        period,
        gstCollected,
        gstPaid,
        netGST,
        taxableSales,
        taxablePurchases,
      },
    };
  } catch (error) {
    console.error("Generate GST report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate GST report",
    };
  }
}

/**
 * Generate Cash Flow Statement
 * Shows cash inflows and outflows for a period
 */
export async function generateCashFlowStatement(
  organizationId: string,
  period: { from: Date; to: Date }
): Promise<ApiResponse<{
  organizationId: string;
  period: { from: Date; to: Date };
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
}>> {
  try {
    // Get bank transactions for the period
    const { bankTransactions: bankTxns } = await import("@/lib/db/schema");

    const transactions = await db
      .select({
        amount: bankTxns.amount,
        description: bankTxns.description,
        transactionType: bankTxns.transactionType,
      })
      .from(bankTxns)
      .where(
        and(
          eq(bankTxns.organizationId, organizationId),
          gte(bankTxns.date, period.from),
          lte(bankTxns.date, period.to)
        )
      );

    // Simple categorization based on transaction type and description
    let operatingCashFlow = 0;
    let investingCashFlow = 0;
    let financingCashFlow = 0;

    transactions.forEach((txn) => {
      const amount = Number(txn.amount) || 0;
      const description = (txn.description || "").toUpperCase();

      // Operating activities: day-to-day business operations
      if (
        description.includes("SALES") ||
        description.includes("PURCHASE") ||
        description.includes("EXPENSE") ||
        description.includes("SALARY") ||
        description.includes("UTILITY") ||
        description.includes("RENT") ||
        description.includes("OFFICE")
      ) {
        operatingCashFlow += amount;
      }
      // Investing activities: purchase/sale of assets
      else if (
        description.includes("EQUIPMENT") ||
        description.includes("PROPERTY") ||
        description.includes("INVESTMENT")
      ) {
        investingCashFlow += amount;
      }
      // Financing activities: loans, capital, dividends
      else if (
        description.includes("LOAN") ||
        description.includes("CAPITAL") ||
        description.includes("DIVIDEND") ||
        description.includes("EQUITY")
      ) {
        financingCashFlow += amount;
      }
      // Default to operating if unclear
      else {
        operatingCashFlow += amount;
      }
    });

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      success: true,
      data: {
        organizationId,
        period,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
      },
    };
  } catch (error) {
    console.error("Generate cash flow statement error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate cash flow statement",
    };
  }
}
