/**
 * BIT Export Server Actions
 *
 * This file contains server actions for generating Bhutan Business Income Tax (BIT)
 * compliant Excel exports for the Silverpine Ledger application.
 */

"use server";

import { db } from "@/lib/db";
import { accounts, organizations } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getTrialBalance, getTransactions } from "@/lib/db/queries";
import * as XLSX from "xlsx";
import {
  BIT_ACCOUNT_MAPPINGS,
  TRIAL_BALANCE_TEMPLATE,
  PROFIT_LOSS_TEMPLATE,
  BALANCE_SHEET_TEMPLATE,
  GST_RECONCILIATION_TEMPLATE,
  DEPRECIATION_SCHEDULE_TEMPLATE,
  getBITCategory,
  getBITSchedule,
  groupAccountsByCategory,
  formatBITCurrency,
  formatBITDate,
  type BITSheet,
  type BITRow,
} from "./templates";
import { validateBITExportData, getValidationErrorMessage } from "./validation";
import type { TrialBalanceReport, AccountType, Transaction } from "@/types";

// ============================================
// Types
// ============================================

export interface BITExportInput {
  organizationId: string;
  financialYearStart: Date;
  financialYearEnd: Date;
  includeDraftTransactions?: boolean;
  exportOptions?: {
    includeTrialBalance?: boolean;
    includeProfitLoss?: boolean;
    includeBalanceSheet?: boolean;
    includeGSTReconciliation?: boolean;
    includeDepreciationSchedule?: boolean;
    includeCompanyInfo?: boolean;
  };
}

export interface BITExportResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    message: string;
  };
  error?: string;
}

export interface BITExportData {
  organization: {
    name: string;
    tpn?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstRegistered?: boolean;
    gstRate?: number;
    fiscalYearEnd?: string;
  };
  trialBalance: TrialBalanceReport;
  financialYear: {
    start: Date;
    end: Date;
  };
  transactions: Transaction[];
  accounts: Array<{
    id: string;
    code: string;
    name: string;
    type: AccountType;
    balance: number;
  }>;
}

// ============================================
// Server Actions
// ============================================

/**
 * Generate BIT Excel export
 */
export async function generateBITExport(input: BITExportInput): Promise<BITExportResult> {
  try {
    console.log("Starting BIT export generation:", {
      organizationId: input.organizationId,
      financialYear: {
        start: input.financialYearStart.toISOString(),
        end: input.financialYearEnd.toISOString(),
      },
    });

    // 1. Fetch organization data
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);

    if (!org) {
      return {
        success: false,
        error: "Organization not found",
      };
    }

    // 2. Fetch accounts
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.organizationId, input.organizationId));

    // 3. Generate trial balance
    const trialBalance = await getTrialBalance(input.organizationId, input.financialYearEnd);

    // 4. Fetch transactions for the period
    const transactions = await getTransactions(input.organizationId, {
      dateRange: {
        from: input.financialYearStart,
        to: input.financialYearEnd,
      },
    });

    // 5. Validate data
    const validationResult = await validateBITExportData(
      trialBalance,
      {
        name: org.name,
        tpn: org.tpn || undefined,
        gstRegistered: org.gstRegistered || undefined,
        gstRate: org.gstRate ? Number(org.gstRate) : undefined,
        fiscalYearEnd: org.fiscalYearEnd || undefined,
      },
      {
        start: input.financialYearStart,
        end: input.financialYearEnd,
      }
    );

    console.log("BIT validation result:", validationResult.summary);

    if (!validationResult.isValid) {
      return {
        success: false,
        validation: {
          isValid: validationResult.isValid,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(e => e.message),
          message: getValidationErrorMessage(validationResult),
        },
      };
    }

    // 6. Generate Excel workbook
    const workbook = XLSX.utils.book_new();

    // Add company information sheet
    if (input.exportOptions?.includeCompanyInfo !== false) {
      const companyInfoSheet = generateCompanyInfoSheet(org, input.financialYearStart, input.financialYearEnd);
      XLSX.utils.book_append_sheet(workbook, companyInfoSheet, "Company Info");
    }

    // Add trial balance sheet
    if (input.exportOptions?.includeTrialBalance !== false) {
      const trialBalanceSheet = generateTrialBalanceSheet(trialBalance);
      XLSX.utils.book_append_sheet(workbook, trialBalanceSheet, "Trial Balance");
    }

    // Add profit & loss sheet
    if (input.exportOptions?.includeProfitLoss !== false) {
      const profitLossSheet = generateProfitLossSheet(trialBalance);
      XLSX.utils.book_append_sheet(workbook, profitLossSheet, "Profit & Loss");
    }

    // Add balance sheet
    if (input.exportOptions?.includeBalanceSheet !== false) {
      const balanceSheet = generateBalanceSheet(trialBalance);
      XLSX.utils.book_append_sheet(workbook, balanceSheet, "Balance Sheet");
    }

    // Add GST reconciliation sheet
    if (input.exportOptions?.includeGSTReconciliation !== false && org.gstRegistered) {
      const gstReconciliationSheet = generateGSTReconciliationSheet(trialBalance, org);
      XLSX.utils.book_append_sheet(workbook, gstReconciliationSheet, "GST Reconciliation");
    }

    // Add depreciation schedule sheet
    if (input.exportOptions?.includeDepreciationSchedule !== false) {
      const depreciationScheduleSheet = generateDepreciationScheduleSheet(trialBalance);
      XLSX.utils.book_append_sheet(workbook, depreciationScheduleSheet, "Depreciation");
    }

    // 7. Generate file
    const fileName = generateBITFileName(org.name, org.tpn, input.financialYearEnd);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    console.log("BIT export generated successfully:", {
      fileName,
      fileSize: buffer.length,
      sheets: workbook.SheetNames,
    });

    // In a real implementation, you would save this to a storage service
    // and return the URL. For now, we'll return the file info.
    return {
      success: true,
      fileName,
      fileSize: buffer.length,
      validation: {
        isValid: true,
        errors: [],
        warnings: validationResult.warnings.map(e => e.message),
        message: "BIT export generated successfully",
      },
    };

    // Note: In production, you would:
    // 1. Upload to cloud storage (S3, Google Drive, etc.)
    // 2. Return download URL
    // 3. Set expiration time for URL
    // 4. Log the export event

  } catch (error) {
    console.error("Error generating BIT export:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Generate company information sheet
 */
function generateCompanyInfoSheet(
  organization: any,
  yearStart: Date,
  yearEnd: Date
): XLSX.WorkSheet {
  const data = [
    ["Business Income Tax Export"],
    [],
    ["Company Information"],
    ["Organization Name", organization.name],
    ["Tax Payer Number (TPN)", organization.tpn || "Not provided"],
    ["Address", organization.address || "Not provided"],
    ["Phone", organization.phone || "Not provided"],
    ["Email", organization.email || "Not provided"],
    [],
    ["Financial Information"],
    ["Financial Year Start", formatBITDate(yearStart)],
    ["Financial Year End", formatBITDate(yearEnd)],
    ["GST Registered", organization.gstRegistered ? "Yes" : "No"],
    ["GST Rate", organization.gstRate ? `${Number(organization.gstRate)}%` : "N/A"],
    ["Fiscal Year End", organization.fiscalYearEnd || "December 31"],
    [],
    ["Export Information"],
    ["Export Date", formatBITDate(new Date())],
    ["Export Generated By", "Silverpine Ledger System"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [{ wch: 30 }, { wch: 40 }];

  return worksheet;
}

/**
 * Generate trial balance sheet
 */
function generateTrialBalanceSheet(trialBalance: TrialBalanceReport): XLSX.WorkSheet {
  const data = [
    ["Trial Balance"],
    [`As of ${formatBITDate(trialBalance.asOfDate)}`],
    [],
    ["Account Code", "Account Name", "Debit", "Credit", "Balance"],
  ];

  // Add account rows
  trialBalance.accounts.forEach(account => {
    data.push([
      account.accountCode,
      account.accountName,
      String(account.debit !== 0 ? Number(account.debit) : ""),
      String(account.credit !== 0 ? Number(account.credit) : ""),
      String(Number(account.balance)),
    ]);
  });

  // Add totals
  data.push([]);
  data.push([
    "",
    "TOTALS",
    String(Number(trialBalance.totalDebits)),
    String(Number(trialBalance.totalCredits)),
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 },  // Account Code
    { wch: 40 },  // Account Name
    { wch: 15 },  // Debit
    { wch: 15 },  // Credit
    { wch: 15 },  // Balance
  ];

  return worksheet;
}

/**
 * Generate profit & loss sheet
 */
function generateProfitLossSheet(trialBalance: TrialBalanceReport): XLSX.WorkSheet {
  const data = [
    ["Statement of Profit and Loss"],
    [`For the period ended ${formatBITDate(trialBalance.asOfDate)}`],
    [],
    ["Category", "Description", "Amount", "Notes"],
  ];

  let totalRevenue = 0;
  let totalExpenses = 0;

  // Revenue section
  const revenueAccounts = trialBalance.accounts.filter(acc => acc.accountType === "revenue");
  if (revenueAccounts.length > 0) {
    data.push(["REVENUE", "", "", ""]);

    // Group by category manually to avoid type issues
    const revenueByCategory: Record<string, typeof revenueAccounts> = {};
    revenueAccounts.forEach(acc => {
      const category = acc.accountCategory || "Other Revenue";
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = [];
      }
      revenueByCategory[category].push(acc);
    });

    Object.entries(revenueByCategory).forEach(([category, accounts]) => {
      const categoryTotal = accounts.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
      totalRevenue += categoryTotal;

      data.push(["", category, Number(categoryTotal), ""]);
      accounts.forEach(acc => {
        data.push(["", `  ${acc.accountName}`, Number(Math.abs(acc.balance)), acc.accountCode]);
      });
    });
    data.push([]);
  }

  // Expenses section
  const expenseAccounts = trialBalance.accounts.filter(acc => acc.accountType === "expense");
  if (expenseAccounts.length > 0) {
    data.push(["EXPENSES", "", "", ""]);
    // Group expenses by category manually
    const expensesByCategory: Record<string, typeof expenseAccounts> = {};
    expenseAccounts.forEach(acc => {
      const category = acc.accountCategory || "Other Expenses";
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = [];
      }
      expensesByCategory[category].push(acc);
    });

    Object.entries(expensesByCategory).forEach(([category, accounts]) => {
      const categoryTotal = accounts.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
      totalExpenses += categoryTotal;

      data.push(["", category, Number(categoryTotal), ""]);
      accounts.forEach(acc => {
        data.push(["", `  ${acc.accountName}`, Number(Math.abs(acc.balance)), acc.accountCode]);
      });
    });
    data.push([]);
  }

  // Net income
  const netIncome = totalRevenue - totalExpenses;
  data.push(["", "NET PROFIT/LOSS", Number(netIncome), netIncome >= 0 ? "Profit" : "Loss"]);
  data.push(["", "Total Revenue", Number(totalRevenue), ""]);
  data.push(["", "Total Expenses", Number(totalExpenses), ""]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 },  // Category
    { wch: 40 },  // Description
    { wch: 15 },  // Amount
    { wch: 15 },  // Notes
  ];

  return worksheet;
}

/**
 * Generate balance sheet
 */
function generateBalanceSheet(trialBalance: TrialBalanceReport): XLSX.WorkSheet {
  const data = [
    ["Balance Sheet"],
    [`As of ${formatBITDate(trialBalance.asOfDate)}`],
    [],
    ["Category", "Description", "Amount", "Notes"],
  ];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  // Assets section
  const assetAccounts = trialBalance.accounts.filter(acc => acc.accountType === "asset");
  if (assetAccounts.length > 0) {
    data.push(["ASSETS", "", "", ""]);
    const mappedAssetAccounts = assetAccounts.map(acc => ({
      code: acc.accountCode,
      name: acc.accountName,
      type: "asset" as const,
    }));
    const groupedAssets = groupAccountsByCategory(mappedAssetAccounts);

    Object.entries(groupedAssets).forEach(([category, accounts]) => {
      const categoryTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      totalAssets += categoryTotal;

      data.push(["", category, Number(categoryTotal), ""]);
      accounts.forEach(acc => {
        data.push(["", `  ${acc.accountName}`, Number(acc.balance), acc.accountCode]);
      });
    });
    data.push(["", "TOTAL ASSETS", Number(totalAssets), ""]);
    data.push([]);
  }

  // Liabilities section
  const liabilityAccounts = trialBalance.accounts.filter(acc => acc.accountType === "liability");
  if (liabilityAccounts.length > 0) {
    data.push(["LIABILITIES", "", "", ""]);
    const mappedLiabilityAccounts = liabilityAccounts.map(acc => ({
      code: acc.accountCode,
      name: acc.accountName,
      type: "liability" as const,
    }));
    const groupedLiabilities = groupAccountsByCategory(mappedLiabilityAccounts);

    Object.entries(groupedLiabilities).forEach(([category, accounts]) => {
      const categoryTotal = accounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
      totalLiabilities += categoryTotal;

      data.push(["", category, Number(categoryTotal), ""]);
      accounts.forEach(acc => {
        data.push(["", `  ${acc.accountName}`, Number(Math.abs(acc.balance)), acc.accountCode]);
      });
    });
    data.push(["", "TOTAL LIABILITIES", Number(totalLiabilities), ""]);
    data.push([]);
  }

  // Equity section
  const equityAccounts = trialBalance.accounts.filter(acc => acc.accountType === "equity");
  if (equityAccounts.length > 0) {
    data.push(["EQUITY", "", "", ""]);
    const mappedEquityAccounts = equityAccounts.map(acc => ({
      code: acc.accountCode,
      name: acc.accountName,
      type: "equity" as const,
    }));
    const groupedEquity = groupAccountsByCategory(mappedEquityAccounts);

    Object.entries(groupedEquity).forEach(([category, accounts]) => {
      const categoryTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      totalEquity += categoryTotal;

      data.push(["", category, Number(categoryTotal), ""]);
      accounts.forEach(acc => {
        data.push(["", `  ${acc.accountName}`, Number(acc.balance), acc.accountCode]);
      });
    });
    data.push(["", "TOTAL EQUITY", Number(totalEquity), ""]);
    data.push([]);
  }

  // Balance check
  const netAssets = totalAssets - totalLiabilities;
  data.push(["", "TOTAL LIABILITIES & EQUITY", Number(totalLiabilities + totalEquity), ""]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 },  // Category
    { wch: 40 },  // Description
    { wch: 15 },  // Amount
    { wch: 15 },  // Notes
  ];

  return worksheet;
}

/**
 * Generate GST reconciliation sheet
 */
function generateGSTReconciliationSheet(trialBalance: TrialBalanceReport, organization: any): XLSX.WorkSheet {
  const gstRate = Number(organization.gstRate) || 7;

  const data = [
    ["GST Reconciliation Statement"],
    [`For the period ended ${formatBITDate(trialBalance.asOfDate)}`],
    [],
    ["Description", "GST Collected", "GST Paid", "Net GST", "Notes"],
  ];

  // Calculate GST from accounts
  const gstCollectedAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("collected")
  );
  const gstPaidAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("paid")
  );
  const gstPayableAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("payable")
  );

  const gstCollected = gstCollectedAccount ? Math.abs(gstCollectedAccount.balance) : 0;
  const gstPaid = gstPaidAccount ? Math.abs(gstPaidAccount.balance) : 0;
  const netGST = gstCollected - gstPaid;

  data.push([
    "GST on Sales",
    Number(gstCollected),
    "",
    "",
    `Calculated at ${gstRate}%`,
  ]);
  data.push([
    "GST on Purchases",
    "",
    Number(gstPaid),
    "",
    `Calculated at ${gstRate}%`,
  ]);
  data.push([]);
  data.push([
    "NET GST PAYABLE/REFUNDABLE",
    Number(gstCollected),
    Number(gstPaid),
    Number(netGST),
    netGST >= 0 ? "Payable" : "Refundable",
  ]);

  if (gstPayableAccount) {
    data.push([]);
    data.push([
      "GST PAYABLE ACCOUNT BALANCE",
      "",
      "",
      Number(Math.abs(gstPayableAccount.balance)),
      "Should match Net GST",
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 30 },  // Description
    { wch: 15 },  // GST Collected
    { wch: 15 },  // GST Paid
    { wch: 15 },  // Net GST
    { wch: 20 },  // Notes
  ];

  return worksheet;
}

/**
 * Generate depreciation schedule sheet
 */
function generateDepreciationScheduleSheet(trialBalance: TrialBalanceReport): XLSX.WorkSheet {
  const data = [
    ["Depreciation Schedule"],
    [`For the period ended ${formatBITDate(trialBalance.asOfDate)}`],
    [],
    ["Asset", "Opening Balance", "Additions", "Disposals", "Depreciation", "Closing Balance"],
  ];

  // Find asset and depreciation accounts
  const fixedAssets = trialBalance.accounts.filter(
    acc => acc.accountType === "asset" &&
    (acc.accountName.toLowerCase().includes("fixed") ||
     acc.accountName.toLowerCase().includes("equipment") ||
     acc.accountName.toLowerCase().includes("furniture") ||
     acc.accountName.toLowerCase().includes("vehicle") ||
     acc.accountName.toLowerCase().includes("building"))
  );

  const accumulatedDepreciation = trialBalance.accounts.filter(
    acc => acc.accountName.toLowerCase().includes("accumulated depreciation")
  );

  const depreciationExpense = trialBalance.accounts.filter(
    acc => acc.accountType === "expense" &&
    acc.accountName.toLowerCase().includes("depreciation")
  );

  // If we have fixed assets, show them
  if (fixedAssets.length > 0) {
    fixedAssets.forEach(asset => {
      const openingBalance = asset.balance; // Simplified - in reality you'd track this over time
      const additions = 0; // Would need historical data
      const disposals = 0; // Would need historical data
      const depreciation = depreciationExpense.reduce((sum, exp) => sum + Math.abs(exp.balance), 0) / fixedAssets.length;
      const closingBalance = openingBalance - depreciation;

      data.push([
        asset.accountName,
        Number(openingBalance),
        Number(additions),
        Number(disposals),
        Number(depreciation),
        Number(closingBalance),
      ]);
    });
  } else {
    data.push(["No fixed assets found", "", "", "", "", ""]);
  }

  // Add total depreciation expense
  if (depreciationExpense.length > 0) {
    const totalDepreciation = depreciationExpense.reduce((sum, exp) => sum + Math.abs(exp.balance), 0);
    data.push([]);
    data.push([
      "TOTAL DEPRECIATION EXPENSE",
      "",
      "",
      "",
      Number(totalDepreciation),
      "",
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 30 },  // Asset
    { wch: 15 },  // Opening Balance
    { wch: 12 },  // Additions
    { wch: 12 },  // Disposals
    { wch: 15 },  // Depreciation
    { wch: 15 },  // Closing Balance
  ];

  return worksheet;
}

/**
 * Generate BIT file name
 */
function generateBITFileName(orgName: string, tpn: string | null, yearEnd: Date): string {
  const sanitizedName = orgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const year = yearEnd.getFullYear();
  const dateStr = formatBITDate(new Date()).replace(/\//g, "-");
  return `BIT_${sanitizedName}_${tpn || "NO_TPN"}_${year}_${dateStr}.xlsx`;
}

/**
 * Validate BIT export before generation
 */
export async function validateBITExport(input: BITExportInput): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}> {
  try {
    // Fetch organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);

    if (!org) {
      return {
        isValid: false,
        errors: ["Organization not found"],
        warnings: [],
        canProceed: false,
      };
    }

    // Generate trial balance for validation
    const trialBalance = await getTrialBalance(input.organizationId, input.financialYearEnd);

    // Run validation
    const validationResult = await validateBITExportData(
      trialBalance,
      {
        name: org.name,
        tpn: org.tpn || undefined,
        gstRegistered: org.gstRegistered || undefined,
        gstRate: org.gstRate ? Number(org.gstRate) : undefined,
        fiscalYearEnd: org.fiscalYearEnd || undefined,
      },
      {
        start: input.financialYearStart,
        end: input.financialYearEnd,
      }
    );

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors.map(e => e.message),
      warnings: validationResult.warnings.map(e => e.message),
      canProceed: validationResult.summary.isReadyForExport,
    };

  } catch (error) {
    console.error("Error validating BIT export:", error);
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      warnings: [],
      canProceed: false,
    };
  }
}