import type {
  Organization as DBOrganization,
  Account as DBAccount,
  Transaction as DBTransaction,
  TransactionLine as DBTransactionLine,
  Receipt as DBReceipt,
  BankTransaction as DBBankTransaction,
} from "@/lib/db/schema";

// ============================================
// Organization Types
// ============================================

export interface Organization extends DBOrganization {
  settings: OrganizationSettings | null;
}

export interface OrganizationSettings {
  currency?: string;
  dateFormat?: string;
  timezone?: string;
  autoReconcile?: boolean;
  notifications?: {
    email?: boolean;
    push?: boolean;
    weeklyReport?: boolean;
  };
}

export interface CreateOrganizationInput {
  clerkOrgId: string;
  name: string;
  tpn?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstRegistered?: boolean;
  gstRate?: number;
  fiscalYearEnd?: string;
  settings?: OrganizationSettings;
}

export interface UpdateOrganizationInput {
  name?: string;
  tpn?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstRegistered?: boolean;
  gstRate?: number;
  fiscalYearEnd?: string;
  logo?: string;
  settings?: OrganizationSettings;
}

// ============================================
// Account Types
// ============================================

export interface Account extends DBAccount {
  children?: Account[];
  parent?: Account;
}

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface CreateAccountInput {
  organizationId: string;
  parentId?: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface UpdateAccountInput {
  parentId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AccountHierarchy {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  level: number;
  children: AccountHierarchy[];
}

// ============================================
// Transaction Types
// ============================================

export interface Transaction extends DBTransaction {
  lines?: TransactionLine[];
}

export type JournalType = "general" | "sales" | "purchase" | "receipt" | "payment" | "adjustment" | "opening";

export interface CreateTransactionInput {
  organizationId: string;
  date: Date;
  description: string;
  reference?: string;
  journalType?: JournalType;
  lines: CreateTransactionLineInput[];
  isPosted?: boolean;
}

export interface UpdateTransactionInput {
  date?: Date;
  description?: string;
  reference?: string;
  isPosted?: boolean;
  isReconciled?: boolean;
}

export interface TransactionLine extends DBTransactionLine {
  account?: Account;
  transaction?: Transaction;
}

export interface CreateTransactionLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface TransactionBalance {
  transactionId: string;
  debits: number;
  credits: number;
  isBalanced: boolean;
}

// ============================================
// Receipt Types
// ============================================

export interface Receipt extends DBReceipt {
  organization?: Organization;
  matchedBankTransactions?: BankTransaction[];
}

export type ReceiptStatus = "pending" | "verified" | "rejected" | "flagged";

export interface CreateReceiptInput {
  organizationId: string;
  vendorName?: string;
  vendorTpn?: string;
  vendorGstNumber?: string;
  date?: Date;
  subtotal?: number;
  gstAmount?: number;
  totalAmount?: number;
  currency?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  documentUrl?: string;
  status?: ReceiptStatus;
  notes?: string;
  extractedData?: ReceiptExtractedData;
}

export interface UpdateReceiptInput {
  vendorName?: string;
  vendorTpn?: string;
  vendorGstNumber?: string;
  date?: Date;
  subtotal?: number;
  gstAmount?: number;
  totalAmount?: number;
  currency?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  documentUrl?: string;
  status?: ReceiptStatus;
  notes?: string;
  extractedData?: ReceiptExtractedData;
}

export interface ReceiptExtractedData {
  confidence?: number;
  extractionMethod?: string;
  rawText?: string;
  lineItems?: ReceiptLineItem[];
}

export interface ReceiptLineItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
}

// ============================================
// Bank Transaction Types
// ============================================

export interface BankTransaction extends DBBankTransaction {
  organization?: Organization;
  category?: Account;
  transaction?: Transaction;
  receipt?: Receipt;
}

export type BankTransactionStatus = "unreconciled" | "reconciled" | "flagged";

export interface CreateBankTransactionInput {
  organizationId: string;
  bankAccountId?: string;
  date: Date;
  description: string;
  reference?: string;
  amount: string;  // Changed to string to match decimal type in database
  balance?: string;  // Changed to string to match decimal type in database
  transactionType: string;
  status?: BankTransactionStatus;
  categoryId?: string;
  transactionId?: string;
  receiptId?: string;
  notes?: string;
  rawData?: BankTransactionRawData;
}

export interface UpdateBankTransactionInput {
  status?: BankTransactionStatus;
  categoryId?: string;
  transactionId?: string;
  receiptId?: string;
  isReconciled?: boolean;
  notes?: string;
}

export interface BankTransactionRawData {
  bankReference?: string;
  code?: string;
  particulars?: string;
}

export interface BankReconciliation {
  bankTransactionId: string;
  transactionId?: string;
  receiptId?: string;
  categoryId?: string;
  status: BankTransactionStatus;
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
}

export interface AuthContext {
  user: AuthUser | null;
  organization: Organization | null;
  userId: string | null;
  orgId: string | null;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success?: boolean; // Adding this for backward compatibility if needed, but will move away from it
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// Filter and Query Types
// ============================================

export interface DateRange {
  from: Date;
  to: Date;
}

export interface TransactionFilters {
  dateRange?: DateRange;
  journalType?: JournalType;
  accountId?: string;
  isReconciled?: boolean;
  search?: string;
}

export interface BankTransactionFilters {
  dateRange?: DateRange;
  status?: BankTransactionStatus;
  categoryId?: string;
  search?: string;
  amountRange?: {
    from: number;
    to: number;
  };
}

export interface ReceiptFilters {
  dateRange?: DateRange;
  status?: ReceiptStatus;
  vendorTpn?: string;
  category?: string;
  search?: string;
}

// ============================================
// Report Types
// ============================================

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  organizationId: string;
  asOfDate: Date;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  accounts: TrialBalanceAccount[];
}

export interface IncomeStatement {
  organizationId: string;
  period: DateRange;
  revenue: number;
  expenses: number;
  netIncome: number;
  accounts: TrialBalanceAccount[];
}

export interface BalanceSheet {
  organizationId: string;
  asOfDate: Date;
  assets: number;
  liabilities: number;
  equity: number;
  accounts: TrialBalanceAccount[];
}

export interface GSTReport {
  organizationId: string;
  period: DateRange;
  gstCollected: number;
  gstPaid: number;
  netGST: number;
  sales: number;
  purchases: number;
}

// ============================================
// Chart of Accounts Template Types
// ============================================

export interface ChartOfAccountsTemplate {
  name: string;
  description: string;
  country: string;
  accounts: CreateAccountInput[];
}

// ============================================
// Utility Types
// ============================================

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;