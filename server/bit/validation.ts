/**
 * BIT Export Data Validation
 *
 * This file contains validation functions to ensure BIT export data
 * complies with Bhutan Business Income Tax requirements.
 */

import type { TrialBalanceReport, TrialBalanceAccount } from "@/types";

// ============================================
// Validation Types
// ============================================

export interface BITValidationResult {
  isValid: boolean;
  errors: BITValidationError[];
  warnings: BITValidationError[];
  summary: BITValidationSummary;
}

export interface BITValidationError {
  type: "error" | "warning";
  code: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "trial-balance" | "profit-loss" | "balance-sheet" | "gst-reconciliation" | "depreciation" | "general";
  details?: any;
}

export interface BITValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  isReadyForExport: boolean;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate complete BIT export data
 */
export async function validateBITExportData(
  trialBalance: TrialBalanceReport,
  organization: {
    name: string;
    tpn?: string;
    gstRegistered?: boolean;
    gstRate?: number;
    fiscalYearEnd?: string;
  },
  financialYear: { start: Date; end: Date }
): Promise<BITValidationResult> {
  const errors: BITValidationError[] = [];
  const warnings: BITValidationError[] = [];

  // Validate organization information
  validateOrganizationInfo(organization, errors, warnings);

  // Validate trial balance
  validateTrialBalance(trialBalance, errors, warnings);

  // Validate financial year
  validateFinancialYear(financialYear, errors, warnings);

  // Validate GST compliance
  validateGSTCompliance(trialBalance, organization, errors, warnings);

  // Validate account structure
  validateAccountStructure(trialBalance, errors, warnings);

  // Build summary
  const summary = buildValidationSummary(errors, warnings);

  return {
    isValid: summary.criticalErrors === 0 && summary.highErrors === 0,
    errors,
    warnings,
    summary,
  };
}

/**
 * Validate organization information
 */
function validateOrganizationInfo(
  organization: {
    name: string;
    tpn?: string;
    gstRegistered?: boolean;
    gstRate?: number;
    fiscalYearEnd?: string;
  },
  errors: BITValidationError[],
  warnings: BITValidationError[]
): void {
  // Check organization name
  if (!organization.name || organization.name.trim().length === 0) {
    errors.push({
      type: "error",
      code: "ORG_NAME_MISSING",
      message: "Organization name is required for BIT export",
      severity: "critical",
      category: "general",
    });
  }

  // Check TPN (Tax Payer Number)
  if (!organization.tpn || organization.tpn.trim().length === 0) {
    errors.push({
      type: "error",
      code: "TPN_MISSING",
      message: "Tax Payer Number (TPN) is required for BIT export",
      severity: "critical",
      category: "general",
    });
  } else if (!/^\d{11}$/.test(organization.tpn.trim())) {
    errors.push({
      type: "error",
      code: "TPN_INVALID_FORMAT",
      message: "TPN must be exactly 11 digits",
      severity: "high",
      category: "general",
      details: { tpn: organization.tpn },
    });
  }

  // Check GST registration
  if (organization.gstRegistered === undefined) {
    warnings.push({
      type: "warning",
      code: "GST_REGISTRATION_NOT_SET",
      message: "GST registration status not specified",
      severity: "medium",
      category: "general",
    });
  }

  // Check GST rate
  if (organization.gstRegistered && (!organization.gstRate || organization.gstRate <= 0)) {
    errors.push({
      type: "error",
      code: "GST_RATE_MISSING",
      message: "GST rate must be specified for GST-registered businesses",
      severity: "high",
      category: "general",
    });
  } else if (organization.gstRate && (organization.gstRate < 0 || organization.gstRate > 100)) {
    errors.push({
      type: "error",
      code: "GST_RATE_INVALID",
      message: "GST rate must be between 0 and 100",
      severity: "high",
      category: "general",
      details: { gstRate: organization.gstRate },
    });
  }

  // Check fiscal year end
  if (!organization.fiscalYearEnd) {
    warnings.push({
      type: "warning",
      code: "FISCAL_YEAR_END_MISSING",
      message: "Fiscal year end not specified, assuming December 31",
      severity: "low",
      category: "general",
    });
  }
}

/**
 * Validate trial balance
 */
function validateTrialBalance(
  trialBalance: TrialBalanceReport,
  errors: BITValidationError[],
  warnings: BITValidationError[]
): void {
  // Check if trial balance is balanced
  if (!trialBalance.isBalanced) {
    errors.push({
      type: "error",
      code: "TRIAL_BALANCE_NOT_BALANCED",
      message: `Trial balance is not balanced: Debits (${trialBalance.totalDebits.toFixed(2)}) ≠ Credits (${trialBalance.totalCredits.toFixed(2)})`,
      severity: "critical",
      category: "trial-balance",
      details: {
        totalDebits: trialBalance.totalDebits,
        totalCredits: trialBalance.totalCredits,
        difference: Math.abs(trialBalance.totalDebits - trialBalance.totalCredits),
      },
    });
  }

  // Check if there are any accounts
  if (!trialBalance.accounts || trialBalance.accounts.length === 0) {
    errors.push({
      type: "error",
      code: "NO_ACCOUNTS",
      message: "No accounts found in trial balance",
      severity: "critical",
      category: "trial-balance",
    });
  }

  // Check for accounts with missing details
  const invalidAccounts = trialBalance.accounts.filter(
    acc => !acc.accountCode || !acc.accountName || !acc.accountType
  );
  if (invalidAccounts.length > 0) {
    errors.push({
      type: "error",
      code: "ACCOUNTS_MISSING_DETAILS",
      message: `${invalidAccounts.length} account(s) are missing required details (code, name, or type)`,
      severity: "high",
      category: "trial-balance",
      details: { invalidAccounts: invalidAccounts.map(acc => acc.accountId) },
    });
  }

  // Check for accounts with zero balances that should be removed
  const zeroBalanceAccounts = trialBalance.accounts.filter(
    acc => acc.debit === 0 && acc.credit === 0 && acc.balance === 0
  );
  if (zeroBalanceAccounts.length > 0) {
    warnings.push({
      type: "warning",
      code: "ZERO_BALANCE_ACCOUNTS",
      message: `${zeroBalanceAccounts.length} account(s) have zero balances and may be excluded from BIT export`,
      severity: "low",
      category: "trial-balance",
      details: { zeroBalanceAccounts: zeroBalanceAccounts.map(acc => acc.accountCode) },
    });
  }
}

/**
 * Validate financial year
 */
function validateFinancialYear(
  financialYear: { start: Date; end: Date },
  errors: BITValidationError[],
  warnings: BITValidationError[]
): void {
  // Check if dates are valid
  if (!financialYear.start || !financialYear.end) {
    errors.push({
      type: "error",
      code: "FINANCIAL_YEAR_INVALID",
      message: "Financial year start and end dates are required",
      severity: "critical",
      category: "general",
    });
    return;
  }

  // Check if end date is after start date
  if (financialYear.end <= financialYear.start) {
    errors.push({
      type: "error",
      code: "FINANCIAL_YEAR_DATES_INVALID",
      message: "Financial year end date must be after start date",
      severity: "critical",
      category: "general",
      details: {
        startDate: financialYear.start.toISOString(),
        endDate: financialYear.end.toISOString(),
      },
    });
  }

  // Check if financial year is reasonable (not too short or too long)
  const yearLength = financialYear.end.getTime() - financialYear.start.getTime();
  const daysInYear = yearLength / (1000 * 60 * 60 * 24);

  if (daysInYear < 350) {
    warnings.push({
      type: "warning",
      code: "FINANCIAL_YEAR_SHORT",
      message: `Financial year is only ${Math.round(daysInYear)} days, which is shorter than expected`,
      severity: "medium",
      category: "general",
    });
  } else if (daysInYear > 380) {
    warnings.push({
      type: "warning",
      code: "FINANCIAL_YEAR_LONG",
      message: `Financial year is ${Math.round(daysInYear)} days, which is longer than expected`,
      severity: "medium",
      category: "general",
    });
  }
}

/**
 * Validate GST compliance
 */
function validateGSTCompliance(
  trialBalance: TrialBalanceReport,
  organization: {
    gstRegistered?: boolean;
    gstRate?: number;
  },
  errors: BITValidationError[],
  warnings: BITValidationError[]
): void {
  if (!organization.gstRegistered) {
    return; // Skip GST validation if not registered
  }

  // Check for GST accounts
  const gstPayableAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("payable")
  );

  const gstReceivableAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("receivable")
  );

  if (!gstPayableAccount && !gstReceivableAccount) {
    warnings.push({
      type: "warning",
      code: "GST_ACCOUNTS_NOT_FOUND",
      message: "No GST payable or receivable accounts found. Please verify GST accounts are set up correctly.",
      severity: "medium",
      category: "gst-reconciliation",
    });
  }

  // Check for GST input and output accounts
  const gstCollectedAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("collected")
  );

  const gstPaidAccount = trialBalance.accounts.find(
    acc => acc.accountName.toLowerCase().includes("gst") && acc.accountName.toLowerCase().includes("paid")
  );

  if (!gstCollectedAccount && !gstPaidAccount) {
    warnings.push({
      type: "warning",
      code: "GST_TRACKING_ACCOUNTS_NOT_FOUND",
      message: "No GST tracking accounts (GST collected/GST paid) found. GST reconciliation may be incomplete.",
      severity: "medium",
      category: "gst-reconciliation",
    });
  }
}

/**
 * Validate account structure
 */
function validateAccountStructure(
  trialBalance: TrialBalanceReport,
  errors: BITValidationError[],
  warnings: BITValidationError[]
): void {
  // Check for required account types
  const accountTypes = new Set(trialBalance.accounts.map(acc => acc.accountType));

  const requiredTypes = ["asset", "liability", "equity", "revenue", "expense"];
  const missingTypes = requiredTypes.filter(type => !accountTypes.has(type as any));

  if (missingTypes.length > 0) {
    errors.push({
      type: "error",
      code: "MISSING_ACCOUNT_TYPES",
      message: `Missing required account types: ${missingTypes.join(", ")}`,
      severity: "high",
      category: "general",
      details: { missingTypes },
    });
  }

  // Check for duplicate account codes
  const accountCodes = trialBalance.accounts.map(acc => acc.accountCode);
  const duplicateCodes = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);

  if (duplicateCodes.length > 0) {
    errors.push({
      type: "error",
      code: "DUPLICATE_ACCOUNT_CODES",
      message: `Duplicate account codes found: ${[...new Set(duplicateCodes)].join(", ")}`,
      severity: "high",
      category: "trial-balance",
      details: { duplicateCodes: [...new Set(duplicateCodes)] },
    });
  }

  // Check for accounts with non-standard naming
  const standardPrefixes = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const nonStandardAccounts = trialBalance.accounts.filter(acc => {
    const firstChar = acc.accountCode.charAt(0);
    return !standardPrefixes.includes(firstChar);
  });

  if (nonStandardAccounts.length > 0) {
    warnings.push({
      type: "warning",
      code: "NON_STANDARD_ACCOUNT_CODES",
      message: `${nonStandardAccounts.length} account(s) have non-standard account codes (should start with 1-9)`,
      severity: "low",
      category: "trial-balance",
      details: { nonStandardAccounts: nonStandardAccounts.map(acc => acc.accountCode) },
    });
  }
}

/**
 * Build validation summary
 */
function buildValidationSummary(
  errors: BITValidationError[],
  warnings: BITValidationError[]
): BITValidationSummary {
  return {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    criticalErrors: errors.filter(e => e.severity === "critical").length,
    highErrors: errors.filter(e => e.severity === "high").length,
    mediumErrors: errors.filter(e => e.severity === "medium").length,
    lowErrors: errors.filter(e => e.severity === "low").length,
    isReadyForExport: errors.filter(e => e.severity === "critical" || e.severity === "high").length === 0,
  };
}

/**
 * Get validation error message
 */
export function getValidationErrorMessage(result: BITValidationResult): string {
  if (result.summary.isReadyForExport) {
    return "BIT export data is valid and ready for export.";
  }

  const criticalIssues = result.errors.filter(e => e.severity === "critical");
  const highIssues = result.errors.filter(e => e.severity === "high");

  if (criticalIssues.length > 0) {
    return `Cannot export BIT data: ${criticalIssues.length} critical issue(s) found.`;
  }

  if (highIssues.length > 0) {
    return `Cannot export BIT data: ${highIssues.length} high priority issue(s) found.`;
  }

  return "BIT export data has issues that need to be resolved.";
}