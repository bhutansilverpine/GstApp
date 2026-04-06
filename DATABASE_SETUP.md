# Silverpine Ledger - Database Setup Guide

This document explains the database schema and authentication system setup for the Silverpine Ledger SaaS application.

## Overview

The application uses:
- **PostgreSQL** as the database (via Supabase)
- **Drizzle ORM** for database access and migrations
- **Clerk** for authentication and organization management
- **Row-Level Security (RLS)** for multi-tenancy data isolation

## Database Schema

### Core Tables

#### 1. Organizations
Multi-tenant organization management with Clerk integration.
- **Primary Key**: UUID
- **Clerk Integration**: `clerk_org_id` for Clerk organization mapping
- **TPN**: Tax Payer Number for GST tracking
- **Settings**: JSONB for flexible configuration

#### 2. Accounts (Chart of Accounts)
Hierarchical account structure for double-entry accounting.
- **Account Types**: Asset, Liability, Equity, Revenue, Expense
- **Hierarchy**: Supports parent-child relationships
- **Balance Tracking**: Real-time balance calculations
- **System Accounts**: Flag for default/locked accounts

#### 3. Transactions (Journal Entries)
Main transaction table for double-entry bookkeeping.
- **Journal Types**: General, Sales, Purchase, Receipt, Payment, Adjustment, Opening
- **Posting Status**: Draft vs Posted transactions
- **Reconciliation**: Track reconciliation status
- **Audit Trail**: Created/update timestamps and user tracking

#### 4. Transaction Lines
Individual debit/credit line items for each transaction.
- **Double-Entry Validation**: Ensures debits = credits per transaction
- **Account Linking**: Foreign key to accounts table
- **Description**: Optional line item descriptions

#### 5. Receipts
AI-extracted receipt data for expense tracking and GST documentation.
- **Vendor Information**: Name, TPN, GST Number
- **Financial Data**: Subtotal, GST, Total
- **Verification Status**: Pending, Verified, Rejected, Flagged
- **Document Storage**: Image and document URLs
- **Extracted Data**: JSONB for AI extraction results

#### 6. Bank Transactions
Bank statement data for reconciliation and categorization.
- **Import Data**: Raw bank data in JSONB
- **Categorization**: Link to chart of accounts
- **Reconciliation**: Match with transactions and receipts
- **Status Tracking**: Unreconciled, Reconciled, Flagged

## Key Features

### Multi-Tenancy
- Organizations are completely isolated using Clerk organization IDs
- All data tables reference `organization_id`
- Row-Level Security (RLS) policies for data isolation

### Data Integrity
- Foreign key constraints ensure referential integrity
- Double-entry validation in transaction lines
- Automatic timestamp updates via triggers
- Indexes for performance optimization

### Audit Trail
- `created_at` and `updated_at` timestamps on all tables
- `created_by` tracking for transactions
- Verification workflow for receipts
- Reconciliation status tracking

## Setup Instructions

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres @clerk/nextjs
npm install -D drizzle-kit
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_key"
CLERK_SECRET_KEY="your_secret"
```

### 3. Run Migrations

```bash
# Generate migrations from schema
npx drizzle-kit generate

# Push schema to database (development)
npx drizzle-kit push

# Or run SQL migrations directly
psql -U your_user -d your_database -f lib/db/migrations/0001_initial_schema.sql
```

### 4. Verify Installation

```bash
# Test database connection
npm run test:db

# Check schema
npx drizzle-kit studio
```

## Database Operations

### Common Queries

#### Get organization accounts
```typescript
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const orgAccounts = await db
  .select()
  .from(accounts)
  .where(eq(accounts.organizationId, orgId));
```

#### Create transaction with lines
```typescript
import { db } from '@/lib/db';
import { transactions, transactionLines } from '@/lib/db/schema';
import { runTransaction } from '@/lib/db';

await runTransaction(async (tx) => {
  const [transaction] = await tx
    .insert(transactions)
    .values({
      organizationId,
      date: new Date(),
      description: 'Journal entry',
      journalType: 'general',
    })
    .returning();

  await tx.insert(transactionLines).values([
    { transactionId: transaction.id, accountId: debitAccount, debit: 100, credit: 0 },
    { transactionId: transaction.id, accountId: creditAccount, debit: 0, credit: 100 },
  ]);
});
```

## Authentication

### Clerk Integration

The application uses Clerk for:
- User authentication
- Organization management
- Multi-tenancy support

### Protected Routes

Routes are protected using middleware (`middleware.ts`):
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhooks`
- Organization required: `/dashboard`, `/accounting`, `/transactions`, etc.

### Auth Helpers

Available in `lib/auth.ts`:
- `getCurrentUser()` - Get authenticated user
- `getCurrentOrganization()` - Get user's selected organization
- `requireAuth()` - Throw if not authenticated
- `requireOrganization()` - Throw if no organization selected
- `hasAccessToOrganization()` - Check org access
- `protectApiRoute()` - Protect API routes

## TypeScript Types

All database tables have corresponding TypeScript types in `types/index.ts`:
- `Organization`, `Account`, `Transaction`, etc.
- Input types: `CreateXxxInput`, `UpdateXxxInput`
- Filter types: `TransactionFilters`, `ReceiptFilters`
- Report types: `TrialBalanceReport`, `IncomeStatement`, etc.

## Row-Level Security

The schema includes RLS policies (commented out in migrations) for:
- Organization-based data isolation
- User access control
- Automatic user ID filtering

## Performance Considerations

### Indexes
Created on:
- Foreign keys (`organization_id`, `parent_id`, etc.)
- Frequently queried columns (`date`, `status`, `code`)
- Composite indexes for common query patterns

### Connection Pooling
- Max connections: 10
- Idle timeout: 20 seconds
- Connect timeout: 10 seconds

## Migration Strategy

1. **Development**: Use `drizzle-kit push` for instant schema updates
2. **Staging/Production**: Use generated migrations with version control
3. **Rollback**: Include down migrations for safe rollbacks

## Troubleshooting

### Connection Issues
```bash
# Test connection string
psql $DATABASE_URL

# Check Drizzle config
cat drizzle.config.ts
```

### Migration Errors
```bash
# View migration status
npx drizzle-kit migrate

# Reset database (development only)
npx drizzle-kit push --force
```

### Type Errors
```bash
# Regenerate types
npx drizzle-kit generate
```

## Next Steps

1. Set up default chart of accounts template
2. Implement receipt AI extraction pipeline
3. Create bank import functionality
4. Build reporting queries
5. Set up automated backups

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Clerk Documentation](https://clerk.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)