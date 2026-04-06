# Silverpine Ledger Server Actions

This directory contains all server actions and business logic for the Silverpine Ledger SaaS application. Server actions are organized by functionality and follow Next.js App Router conventions.

## 📁 Directory Structure

```
server/
├── receipts/           # Receipt processing using Gemini AI
├── bank/              # Bank statement processing
├── transactions/      # Double-entry accounting transactions
├── reconciliation/    # Bank-to-receipt matching engine
├── index.ts           # Main export file
└── README.md          # This file
```

## 🧾 Receipt Processing (`receipts/`)

### Features
- **AI-powered extraction** using Google Gemini 2.0 Flash
- **Multi-receipt PDF processing** from statements
- **Single receipt processing** for mobile/web uploads
- **Automatic GST calculation** (7% for Bhutan)
- **Verification workflow** for data accuracy
- **Comprehensive filtering and reporting**

### Key Functions

#### `processReceipts(formData, organizationId)`
Process multi-receipt PDF statements using AI extraction.

**Returns:**
- Extracted receipt data with vendor, TPN, amounts
- Automatic GST calculation for TPN-containing receipts
- Summary totals for audit reports

**Features:**
- Handles ~40+ receipts per PDF
- Supabase Storage integration
- Optimized Gemini prompts for accuracy
- Data validation and error handling

#### `verifyReceipt(receiptId, organizationId, updates)`
Verify and correct AI-extracted receipt data.

**Features:**
- Auto-recalculates GST based on TPN presence
- Updates status to "verified"
- Supports batch verification
- Reject/flag functionality

#### `listReceipts(options)`
List receipts with advanced filtering.

**Filters:**
- Date ranges
- Status (pending, verified, rejected, flagged)
- Vendor TPN
- Category
- Full-text search

#### `getGSTReport(organizationId, dateRange)`
Generate GST compliance reports.

**Returns:**
- Total purchases
- GST claimable vs non-claimable
- Receipt breakdown by category
- RRCO audit-ready data

## 🏦 Bank Statement Processing (`bank/`)

### Features
- **Multi-format support** (BOB, BNB statements)
- **Password-protected PDF handling**
- **Intelligent categorization**
- **Payment mode extraction**
- **Merchant identification**

### Key Functions

#### `processBankStatement(formData, organizationId)`
Process bank statement PDFs with automatic parsing.

**Features:**
- Handles multi-line transactions
- Extracts: date, description, amounts, balance
- Auto-categorizes using keyword rules
- Identifies payment modes (GPAY, MBANK, ATM, etc.)
- Cleans merchant names

**Format Support:**
- BNB (Bhutan National Bank)
- BOB (Bank of Bhutan)
- Auto-detection for other formats

#### `autoCategorizeTransactions(organizationId)`
Automatically categorize uncategorized transactions.

**Categories:**
- FUEL, FOOD, SHOPPING, UTILITY
- TRANSPORT, HEALTH, OFFICE SUPPLIES
- MISC/PERSONAL for others

**Features:**
- Keyword-based rules
- Payment mode detection
- Merchant extraction
- Account number parsing

#### `getCashFlowAnalysis(organizationId, dateRange)`
Analyze cash flow patterns.

**Returns:**
- Total inflow/outflow
- Net cash flow
- Daily averages
- Largest transactions
- Transaction counts

## 💰 Transaction Management (`transactions/`)

### Features
- **Double-entry bookkeeping**
- **Automatic balance updates**
- **Transaction validation**
- **Comprehensive reporting**
- **Reversal handling**

### Key Functions

#### `createTransaction(input, organizationId, userId)`
Create double-entry journal entries.

**Validation:**
- Debits must equal credits
- Minimum 2 transaction lines
- Account ownership verification
- Amount precision checking

**Features:**
- Automatic account balance updates
- Support for all journal types
- Transaction posting workflow
- User attribution

#### `generateTrialBalance(organizationId, asOfDate)`
Generate trial balance report.

**Returns:**
- Account balances with debit/credit columns
- Balance verification (assets vs liabilities + equity)
- Sorted by account code
- Export-ready format

#### `generateIncomeStatement(organizationId, period)`
Generate profit & loss statement.

**Returns:**
- Revenue totals
- Expense breakdown
- Net income/loss
- Account-level details

#### `generateBalanceSheet(organizationId, asOfDate)`
Generate balance sheet report.

**Returns:**
- Assets, liabilities, equity totals
- Account-type grouping
- Balance verification
- Date-specific snapshot

## 🔗 Reconciliation Engine (`reconciliation/`)

### Features
- **Intelligent matching algorithms**
- **Confidence scoring**
- **Multi-criteria matching**
- **Batch processing**
- **Status tracking**

### Key Functions

#### `findMatches(organizationId, options)`
Find intelligent matches between bank transactions and receipts.

**Matching Criteria:**
- Amount matching (40% weight)
- Date proximity (30% weight)
- Vendor name similarity (20% weight)
- Category keywords (10% weight)
- TPN presence bonus

**Options:**
- Date tolerance (default: ±3 days)
- Amount tolerance (default: ±0.50)
- Vendor match requirement

**Returns:**
- Confidence-scored suggestions
- Match reasons for transparency
- Unmatched items for manual review

#### `confirmMatch(bankTransactionId, receiptId, organizationId)`
Confirm a reconciliation match.

**Features:**
- Creates journal entry automatically
- Updates both bank transaction and receipt
- Marks as reconciled with timestamp
- Transaction linking for audit trail

#### `getReconciliationStatus(organizationId, dateRange)`
Get comprehensive reconciliation status.

**Returns:**
- Transaction counts (total, reconciled, unreconciled)
- Receipt matching statistics
- Progress percentage
- Recent activity log
- Daily breakdown

#### `autoMatch(organizationId, confidenceThreshold)`
Auto-confirm high-confidence matches.

**Features:**
- Configurable confidence threshold (default: 80%)
- Batch processing
- Safety validation
- Progress tracking

## 🔒 Security & Validation

All server actions include:
- **Organization ownership verification** - Users can only access their org's data
- **Input validation** - Type checking and sanitization
- **Error handling** - Comprehensive error messages
- **Transaction safety** - Database transactions for data integrity
- **Cache revalidation** - Automatic Next.js cache updates

## 📊 Key Features

### AI Integration
- **Google Gemini 2.0 Flash** for receipt extraction
- **Optimized prompts** for Bhutanese receipts
- **Multi-document support** (PDFs, images)
- **Confidence scoring** for extraction accuracy

### Accounting Engine
- **True double-entry** bookkeeping
- **Automatic balance calculations**
- **Transaction validation**
- **Reversal handling**
- **Audit trail**

### Reconciliation System
- **Intelligent matching** with confidence scores
- **Multi-criteria comparison**
- **Auto-match capabilities**
- **Manual override options**
- **Status tracking**

### Reporting
- **GAAP-compliant** reports
- **GST-ready** for Bhutan
- **Real-time calculations**
- **Export capabilities**
- **Multi-format support**

## 🚀 Usage Examples

### Process Receipts
```typescript
import { processReceipts } from "@/server";

const formData = new FormData();
formData.append("file", pdfFile);

const result = await processReceipts(formData, organizationId);
if (result.success) {
  console.log(`Processed ${result.summary?.totalReceipts} receipts`);
}
```

### Create Transaction
```typescript
import { createTransaction } from "@/server";

const transaction = await createTransaction({
  organizationId,
  date: new Date(),
  description: "Office Rent Payment",
  journalType: "payment",
  lines: [
    { accountId: "bank-id", debit: 5000, credit: 0 },
    { accountId: "expense-id", debit: 0, credit: 5000 }
  ]
}, organizationId, userId);
```

### Reconcile Automatically
```typescript
import { findMatches, autoMatch } from "@/server";

// Find potential matches
const matches = await findMatches(organizationId, {
  dateToleranceDays: 3,
  amountTolerance: 0.5
});

// Auto-confirm high-confidence matches
const result = await autoMatch(organizationId, 80);
console.log(`Auto-matched ${result.data?.matched} transactions`);
```

## 📝 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# AI Services
GEMINI_API_KEY=AIzaSy...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## 🧪 Testing

All server actions include comprehensive error handling and validation. They can be tested independently or integrated into the UI components.

## 📚 Type Safety

Full TypeScript support with exported types:
- Input types for all mutations
- Response types for API consistency
- Filter types for queries
- Report types for financial statements

## 🔄 Data Flow

1. **Receipt Upload** → AI Extraction → Verification → Posted
2. **Bank Statement** → Parsing → Categorization → Reconciliation
3. **Reconciliation** → Matching → Confirmation → Journal Entry
4. **Reporting** → Real-time Calculations → Export

## 🛠️ Tech Stack

- **Next.js App Router** - Server actions
- **Drizzle ORM** - Database queries
- **PostgreSQL** - Data persistence
- **Google Gemini AI** - Receipt extraction
- **Supabase Storage** - File storage
- **TypeScript** - Type safety

## 📄 License

Proprietary - Silverpine Ledger © 2025
