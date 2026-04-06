/**
 * BIT Excel Template Definitions and Mappings
 *
 * This file contains the template structures and mappings for generating
 * Bhutan Business Income Tax (BIT) compliant Excel exports.
 */

import { AccountType } from "@/types";

// ============================================
// BIT Template Structure
// ============================================

export interface BITTemplate {
  trialBalance: BITSheet;
  profitLoss: BITSheet;
  balanceSheet: BITSheet;
  gstReconciliation: BITSheet;
  depreciationSchedule: BITSheet;
}

export interface BITSheet {
  name: string;
  title: string;
  headers: string[];
  rows: BITRow[];
  formatting: BITFormatting;
}

export interface BITRow {
  accountCode?: string;
  accountName: string;
  description?: string;
  amount: number;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isBold?: boolean;
  level?: number;
}

export interface BITFormatting {
  columnWidths: number[];
  headerStyle: {
    font: { bold: boolean; size: number; color: { argb: string } };
    fill: { fgColor: { argb: string } };
    alignment: { horizontal: string; vertical: string };
  };
  currencyFormat: string;
  dateFormat: string;
}

// ============================================
// BIT Account Mappings
// ============================================

export interface BITAccountMapping {
  accountType: AccountType;
  bitCategory: string;
  bitSchedule: "trial-balance" | "profit-loss" | "balance-sheet" | "gst-reconciliation" | "depreciation";
  priority: number;
}

export const BIT_ACCOUNT_MAPPINGS: Record<string, BITAccountMapping> = {
  // Asset Accounts
  "1000": {
    accountType: "asset",
    bitCategory: "Current Assets",
    bitSchedule: "balance-sheet",
    priority: 1,
  },
  "1100": {
    accountType: "asset",
    bitCategory: "Cash and Cash Equivalents",
    bitSchedule: "balance-sheet",
    priority: 2,
  },
  "1200": {
    accountType: "asset",
    bitCategory: "Accounts Receivable",
    bitSchedule: "balance-sheet",
    priority: 3,
  },
  "1500": {
    accountType: "asset",
    bitCategory: "Fixed Assets",
    bitSchedule: "balance-sheet",
    priority: 4,
  },
  "1600": {
    accountType: "asset",
    bitCategory: "Accumulated Depreciation",
    bitSchedule: "depreciation",
    priority: 1,
  },

  // Liability Accounts
  "2000": {
    accountType: "liability",
    bitCategory: "Current Liabilities",
    bitSchedule: "balance-sheet",
    priority: 10,
  },
  "2100": {
    accountType: "liability",
    bitCategory: "Accounts Payable",
    bitSchedule: "balance-sheet",
    priority: 11,
  },
  "2200": {
    accountType: "liability",
    bitCategory: "GST Payable",
    bitSchedule: "gst-reconciliation",
    priority: 1,
  },
  "2300": {
    accountType: "liability",
    bitCategory: "Income Tax Payable",
    bitSchedule: "balance-sheet",
    priority: 12,
  },

  // Equity Accounts
  "3000": {
    accountType: "equity",
    bitCategory: "Owner's Equity",
    bitSchedule: "balance-sheet",
    priority: 20,
  },
  "3100": {
    accountType: "equity",
    bitCategory: "Share Capital",
    bitSchedule: "balance-sheet",
    priority: 21,
  },
  "3200": {
    accountType: "equity",
    bitCategory: "Retained Earnings",
    bitSchedule: "balance-sheet",
    priority: 22,
  },

  // Revenue Accounts
  "4000": {
    accountType: "revenue",
    bitCategory: "Revenue",
    bitSchedule: "profit-loss",
    priority: 30,
  },
  "4100": {
    accountType: "revenue",
    bitCategory: "Sales Revenue",
    bitSchedule: "profit-loss",
    priority: 31,
  },
  "4200": {
    accountType: "revenue",
    bitCategory: "Service Revenue",
    bitSchedule: "profit-loss",
    priority: 32,
  },
  "4300": {
    accountType: "revenue",
    bitCategory: "Other Income",
    bitSchedule: "profit-loss",
    priority: 33,
  },

  // Expense Accounts
  "5000": {
    accountType: "expense",
    bitCategory: "Operating Expenses",
    bitSchedule: "profit-loss",
    priority: 40,
  },
  "5100": {
    accountType: "expense",
    bitCategory: "Cost of Goods Sold",
    bitSchedule: "profit-loss",
    priority: 41,
  },
  "5200": {
    accountType: "expense",
    bitCategory: "Salaries and Wages",
    bitSchedule: "profit-loss",
    priority: 42,
  },
  "5300": {
    accountType: "expense",
    bitCategory: "Rent Expense",
    bitSchedule: "profit-loss",
    priority: 43,
  },
  "5400": {
    accountType: "expense",
    bitCategory: "Utilities Expense",
    bitSchedule: "profit-loss",
    priority: 44,
  },
  "5500": {
    accountType: "expense",
    bitCategory: "Depreciation Expense",
    bitSchedule: "depreciation",
    priority: 2,
  },
  "5600": {
    accountType: "expense",
    bitCategory: "Interest Expense",
    bitSchedule: "profit-loss",
    priority: 45,
  },
  "5700": {
    accountType: "expense",
    bitCategory: "Tax Expense",
    bitSchedule: "profit-loss",
    priority: 46,
  },
};

// ============================================
// Default BIT Formatting
// ============================================

export const DEFAULT_BIT_FORMATTING: BITFormatting = {
  columnWidths: [15, 40, 20, 20, 20],
  headerStyle: {
    font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } },
    fill: { fgColor: { argb: "FF4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
  },
  currencyFormat: "#,##0.00",
  dateFormat: "dd/mm/yyyy",
};

// ============================================
// BIT Sheet Templates
// ============================================

export const TRIAL_BALANCE_TEMPLATE: BITSheet = {
  name: "Trial Balance",
  title: "Trial Balance",
  headers: ["Account Code", "Account Name", "Debit", "Credit", "Balance"],
  rows: [],
  formatting: DEFAULT_BIT_FORMATTING,
};

export const PROFIT_LOSS_TEMPLATE: BITSheet = {
  name: "Profit & Loss",
  title: "Statement of Profit and Loss",
  headers: ["Category", "Description", "Amount", "Notes"],
  rows: [],
  formatting: DEFAULT_BIT_FORMATTING,
};

export const BALANCE_SHEET_TEMPLATE: BITSheet = {
  name: "Balance Sheet",
  title: "Balance Sheet",
  headers: ["Category", "Description", "Amount", "Notes"],
  rows: [],
  formatting: DEFAULT_BIT_FORMATTING,
};

export const GST_RECONCILIATION_TEMPLATE: BITSheet = {
  name: "GST Reconciliation",
  title: "GST Reconciliation Statement",
  headers: ["Description", "GST Collected", "GST Paid", "Net GST", "Notes"],
  rows: [],
  formatting: DEFAULT_BIT_FORMATTING,
};

export const DEPRECIATION_SCHEDULE_TEMPLATE: BITSheet = {
  name: "Depreciation",
  title: "Depreciation Schedule",
  headers: ["Asset", "Opening Balance", "Additions", "Disposals", "Depreciation", "Closing Balance"],
  rows: [],
  formatting: DEFAULT_BIT_FORMATTING,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get BIT category for an account
 */
export function getBITCategory(accountCode: string, accountType: AccountType): string {
  const mapping = BIT_ACCOUNT_MAPPINGS[accountCode];
  if (mapping) {
    return mapping.bitCategory;
  }

  // Default categories based on account type
  switch (accountType) {
    case "asset":
      return "Other Assets";
    case "liability":
      return "Other Liabilities";
    case "equity":
      return "Other Equity";
    case "revenue":
      return "Other Revenue";
    case "expense":
      return "Other Expenses";
    default:
      return "Uncategorized";
  }
}

/**
 * Get BIT schedule for an account
 */
export function getBITSchedule(accountCode: string, accountType: AccountType): string {
  const mapping = BIT_ACCOUNT_MAPPINGS[accountCode];
  if (mapping) {
    return mapping.bitSchedule;
  }

  // Default schedules based on account type
  switch (accountType) {
    case "asset":
    case "liability":
    case "equity":
      return "balance-sheet";
    case "revenue":
    case "expense":
      return "profit-loss";
    default:
      return "trial-balance";
  }
}

/**
 * Get accounts for a specific BIT schedule
 */
export function getAccountsForSchedule(
  accounts: Array<{ code: string; name: string; type: AccountType }>,
  schedule: string
): Array<{ code: string; name: string; type: AccountType }> {
  return accounts.filter(account => getBITSchedule(account.code, account.type) === schedule);
}

/**
 * Group accounts by BIT category
 */
export function groupAccountsByCategory<T extends { code: string; name: string; type: AccountType }>(
  accounts: Array<T>
): Record<string, Array<T>> {
  const grouped: Record<string, Array<T>> = {};

  accounts.forEach(account => {
    const category = getBITCategory(account.code, account.type);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(account);
  });

  return grouped;
}

/**
 * Format number as BIT currency
 */
export function formatBITCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date as BIT date
 */
export function formatBITDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}