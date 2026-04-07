import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";

// Enums
export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

export const journalTypeEnum = pgEnum("journal_type", [
  "general",
  "sales",
  "purchase",
  "receipt",
  "payment",
  "adjustment",
  "opening",
]);

export const receiptStatusEnum = pgEnum("receipt_status", [
  "pending",
  "verified",
  "rejected",
  "flagged",
]);

export const bankTransactionStatusEnum = pgEnum("bank_transaction_status", [
  "unreconciled",
  "reconciled",
  "flagged",
]);

// Organizations table for multi-tenancy
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: varchar("clerk_org_id", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    tpn: varchar("tpn", { length: 50 }).unique(),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    gstRegistered: boolean("gst_registered").default(true),
    gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("15"),
    fiscalYearEnd: varchar("fiscal_year_end", { length: 20 }).default("03-31"),
    logo: text("logo"),
    settings: jsonb("settings").$type<{
      currency?: string;
      dateFormat?: string;
      timezone?: string;
      autoReconcile?: boolean;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clerkOrgIdIdx: index("organizations_clerk_org_id_idx").on(table.clerkOrgId),
    tpnIdx: index("organizations_tpn_idx").on(table.tpn),
  })
);

// Accounts (Chart of Accounts)
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    parentId: uuid("parent_id").references((): any => accounts.id, { onDelete: "set null" }),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: accountTypeEnum("type").notNull(),
    description: text("description"),
    balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
    isActive: boolean("is_active").default(true),
    isSystem: boolean("is_system").default(false),
    level: integer("level").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("accounts_organization_id_idx").on(table.organizationId),
    parentIdIdx: index("accounts_parent_id_idx").on(table.parentId),
    codeIdx: index("accounts_code_idx").on(table.code),
    organizationCodeUnique: index("accounts_organization_code_unique").on(table.organizationId, table.code),
  })
);

// Transactions (Journal Entries)
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    reference: varchar("reference", { length: 255 }),
    journalType: journalTypeEnum("type").default("general"),
    isPosted: boolean("is_posted").default(false),
    isReconciled: boolean("is_reconciled").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: varchar("created_by", { length: 255 }),
  },
  (table) => ({
    organizationIdIdx: index("transactions_organization_id_idx").on(table.organizationId),
    dateIdx: index("transactions_date_idx").on(table.date),
    journalTypeIdx: index("transactions_type_idx").on(table.journalType),
    referenceIdx: index("transactions_reference_idx").on(table.reference),
  })
);

// Transaction Lines (Debit/Credit entries)
export const transactionLines = pgTable(
  "transaction_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id")
      .references(() => transactions.id, { onDelete: "cascade" })
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "restrict" })
      .notNull(),
    description: text("description"),
    debit: decimal("debit", { precision: 15, scale: 2 }).default("0"),
    credit: decimal("credit", { precision: 15, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    transactionIdIdx: index("transaction_lines_transaction_id_idx").on(table.transactionId),
    accountIdIdx: index("transaction_lines_account_id_idx").on(table.accountId),
    accountIdTransactionIdUnique: index("transaction_lines_account_transaction_unique").on(table.transactionId, table.accountId),
  })
);

// Receipts (AI-extracted from documents)
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    vendorName: varchar("vendor_name", { length: 255 }),
    vendorTpn: varchar("vendor_tpn", { length: 50 }),
    vendorGstNumber: varchar("vendor_gst_number", { length: 50 }),
    date: timestamp("date", { withTimezone: true }),
    subtotal: decimal("subtotal", { precision: 15, scale: 2 }).default("0"),
    gstAmount: decimal("gst_amount", { precision: 15, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
    currency: varchar("currency", { length: 10 }).default("BTN"),
    category: varchar("category", { length: 255 }),
    description: text("description"),
    imageUrl: text("image_url"),
    documentUrl: text("document_url"),
    status: receiptStatusEnum("status").default("pending"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: varchar("verified_by", { length: 255 }),
    notes: text("notes"),
    extractedData: jsonb("extracted_data").$type<{
      confidence?: number;
      extractionMethod?: string;
      rawText?: string;
      lineItems?: Array<{
        description?: string;
        quantity?: number;
        unitPrice?: number;
        amount?: number;
      }>;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("receipts_organization_id_idx").on(table.organizationId),
    dateIdx: index("receipts_date_idx").on(table.date),
    statusIdx: index("receipts_status_idx").on(table.status),
    vendorTpnIdx: index("receipts_vendor_tpn_idx").on(table.vendorTpn),
  })
);

// Bank Transactions
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    bankAccountId: uuid("bank_account_id"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    reference: varchar("reference", { length: 255 }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    balance: decimal("balance", { precision: 15, scale: 2 }),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(),
    status: bankTransactionStatusEnum("status").default("unreconciled"),
    categoryId: uuid("category_id").references(() => accounts.id, { onDelete: "set null" }),
    transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
    receiptId: uuid("receipt_id").references(() => receipts.id, { onDelete: "set null" }),
    isReconciled: boolean("is_reconciled").default(false),
    reconciledAt: timestamp("reconciled_at"),
    notes: text("notes"),
    rawData: jsonb("raw_data").$type<{
      bankReference?: string;
      code?: string;
      particulars?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("bank_transactions_organization_id_idx").on(table.organizationId),
    bankAccountIdIdx: index("bank_transactions_bank_account_id_idx").on(table.bankAccountId),
    dateIdx: index("bank_transactions_date_idx").on(table.date),
    statusIdx: index("bank_transactions_status_idx").on(table.status),
    transactionIdIdx: index("bank_transactions_transaction_id_idx").on(table.transactionId),
    receiptIdIdx: index("bank_transactions_receipt_id_idx").on(table.receiptId),
    categoryIdIdx: index("bank_transactions_category_id_idx").on(table.categoryId),
  })
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  receipts: many(receipts),
  bankTransactions: many(bankTransactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organizationId],
    references: [organizations.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  transactionLines: many(transactionLines),
  categorizedBankTransactions: many(bankTransactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [transactions.organizationId],
    references: [organizations.id],
  }),
  lines: many(transactionLines),
  matchedBankTransactions: many(bankTransactions),
}));

export const transactionLinesRelations = relations(transactionLines, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLines.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [transactionLines.accountId],
    references: [accounts.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [receipts.organizationId],
    references: [organizations.id],
  }),
  matchedBankTransactions: many(bankTransactions),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [bankTransactions.organizationId],
    references: [organizations.id],
  }),
  category: one(accounts, {
    fields: [bankTransactions.categoryId],
    references: [accounts.id],
  }),
  transaction: one(transactions, {
    fields: [bankTransactions.transactionId],
    references: [transactions.id],
  }),
  receipt: one(receipts, {
    fields: [bankTransactions.receiptId],
    references: [receipts.id],
  }),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionLine = typeof transactionLines.$inferSelect;
export type NewTransactionLine = typeof transactionLines.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type NewBankTransaction = typeof bankTransactions.$inferInsert;