/**
 * Silverpine Ledger Server Actions
 *
 * This file exports all server actions for easy importing throughout the application.
 * Server actions are organized by functionality.
 */

// ============================================
// RECEIPT PROCESSING
// ============================================

export * from "./receipts/process"; // processReceipts, processSingleReceipt
export * from "./receipts/verify"; // verifyReceipt, batchVerifyReceipts, rejectReceipt, flagReceipt, deleteReceipt
export * from "./receipts/list"; // listReceipts, getReceipt, getReceiptsSummary, getUniqueVendors, getPendingReceipts, getGSTReport

// ============================================
// BANK STATEMENT PROCESSING
// ============================================

export * from "./bank/process"; // processBankStatement
export * from "./bank/categorize"; // autoCategorizeTransactions, categorizeTransactionManual, batchCategorizeTransactions, getCategorySuggestions, getCategorizationStats
export { listBankTransactions, getBankTransaction, getBankTransactionsSummary, getUnreconciledTransactions, searchBankTransactions, getTransactionsByDateRange as getBankTransactionsByDateRange, getCashFlowAnalysis, updateTransactionNotes, flagTransaction } from "./bank/list";

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

export * from "./transactions/create"; // createTransaction, postTransaction, reverseTransaction, deleteTransaction, updateTransaction
export * from "./transactions/list"; // listTransactions, getTransaction, getTransactionsByJournalType, getPostedTransactions, getUnpostedTransactions, searchTransactions, getTransactionsByDateRange, getTransactionsSummary, getAccountActivity
export * from "./transactions/reports"; // generateTrialBalance, generateIncomeStatement, generateBalanceSheet, generateGSTReport, generateCashFlowStatement

// ============================================
// RECONCILIATION ENGINE
// ============================================

export * from "./reconciliation/match"; // findMatches, findMatchesForBankTransaction, findMatchesForReceipt, autoMatch
export * from "./reconciliation/confirm"; // confirmMatch, rejectMatch, batchConfirmMatches, unconfirmMatch, manualMatch, reconcileWithoutReceipt
export * from "./reconciliation/status"; // getReconciliationStatus, getReconciliationReport, getUnreconciledItems, getReconciliationStats, exportReconciliationData

// ============================================
// UTILITY FUNCTIONS (from categorize.ts)
// ============================================

export {
  categorizeTransaction,
  extractPaymentMode,
  extractAccountNumber,
  extractMerchantName,
} from "./bank/categorize";

// ============================================
// TYPE EXPORTS
// ============================================

export type {
  // Receipt types
  CreateReceiptInput,
  UpdateReceiptInput,
  ReceiptExtractedData,
  ReceiptLineItem,

  // Bank transaction types
  CreateBankTransactionInput,
  UpdateBankTransactionInput,
  BankTransactionRawData,

  // Transaction types
  CreateTransactionInput,
  CreateTransactionLineInput,
  UpdateTransactionInput,
  TransactionBalance,

  // Filter types
  ReceiptFilters,
  BankTransactionFilters,
  TransactionFilters,
  DateRange,

  // Report types
  TrialBalanceReport,
  IncomeStatement,
  BalanceSheet,

  // API response types
  ApiResponse,
  PaginatedResponse,
  ValidationError,
} from "@/types";
