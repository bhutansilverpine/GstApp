# Silverpine Ledger - Developer Quick Start

This guide will help you quickly get up to speed with the database schema and authentication system.

## File Structure

```
silverpine-ledger/
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema definitions
│   │   ├── index.ts           # Database client setup
│   │   ├── queries.ts         # Pre-built database queries
│   │   ├── seed.ts            # Database seeding utilities
│   │   └── migrations/        # SQL migration files
│   └── auth.ts                # Clerk authentication helpers
├── types/
│   └── index.ts               # TypeScript types and interfaces
├── middleware.ts              # Next.js middleware for route protection
├── drizzle.config.ts          # Drizzle ORM configuration
└── .env.example               # Environment variables template
```

## Key Concepts

### Multi-Tenancy
- Every table has `organization_id` for data isolation
- Users belong to Clerk organizations
- Row-Level Security (RLS) policies ensure data separation

### Double-Entry Accounting
- Every transaction must have equal debits and credits
- Transaction lines link to chart of accounts
- Accounts maintain running balances

## Common Operations

### 1. Database Queries

```typescript
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get accounts
const orgAccounts = await db
  .select()
  .from(accounts)
  .where(eq(accounts.organizationId, orgId));
```

### 2. Using Pre-built Queries

```typescript
import { getAccountsByOrganization } from '@/lib/db/queries';

// Get all accounts for an organization
const accounts = await getAccountsByOrganization(orgId);

// Get account hierarchy
const hierarchy = await getAccountHierarchy(orgId);

// Get filtered transactions
const transactions = await getTransactions(orgId, {
  dateRange: { from: startDate, to: endDate },
  journalType: 'sales'
});
```

### 3. Authentication

```typescript
import { getCurrentUser, requireOrganization } from '@/lib/auth';

// Get current user
const user = await getCurrentUser();

// Get current organization
const organization = await requireOrganization();

// Protect API routes
const { user, organization } = await protectApiRoute();
```

### 4. Creating Transactions

```typescript
import { db } from '@/lib/db';
import { transactions, transactionLines } from '@/lib/db/schema';
import { runTransaction } from '@/lib/db';

await runTransaction(async (tx) => {
  // Create transaction
  const [transaction] = await tx
    .insert(transactions)
    .values({
      organizationId,
      date: new Date(),
      description: 'Office supplies purchase',
      journalType: 'purchase',
    })
    .returning();

  // Add line items
  await tx.insert(transactionLines).values([
    {
      transactionId: transaction.id,
      accountId: expenseAccountId,
      debit: 115,
      credit: 0,
      description: 'Office supplies'
    },
    {
      transactionId: transaction.id,
      accountId: gstAccountId,
      debit: 15,
      credit: 0,
      description: 'GST'
    },
    {
      transactionId: transaction.id,
      accountId: bankAccountId,
      debit: 0,
      credit: 130,
      description: 'Payment'
    },
  ]);
});
```

### 5. Working with Receipts

```typescript
import { db } from '@/lib/db';
import { receipts } from '@/lib/db/schema';

// Create receipt from AI extraction
const [receipt] = await db
  .insert(receipts)
  .values({
    organizationId,
    vendorName: 'Office Supplies Co',
    vendorTpn: '123456789',
    date: new Date(),
    subtotal: 100,
    gstAmount: 15,
    totalAmount: 115,
    currency: 'NZD',
    status: 'pending',
    extractedData: {
      confidence: 0.95,
      extractionMethod: 'ai_vision',
      rawText: '...'
    }
  })
  .returning();
```

## Database Schema Overview

### Organizations
- Multi-tenant isolation
- Clerk integration
- GST configuration

### Accounts (Chart of Accounts)
- Hierarchical structure
- Asset/Liability/Equity/Revenue/Expense types
- Balance tracking

### Transactions & Lines
- Double-entry validation
- Journal type classification
- Reconciliation tracking

### Receipts
- AI-extracted data
- Vendor TPN tracking
- GST calculation
- Verification workflow

### Bank Transactions
- Import from bank feeds
- Categorization
- Reconciliation matching
- Raw data preservation

## Authentication Flow

1. **User signs in** → Clerk handles authentication
2. **User selects organization** → Organization context stored
3. **Protected routes** → Middleware checks auth + org
4. **Data access** → All queries filtered by organization_id

## TypeScript Types

All database entities have corresponding types:

```typescript
import type {
  Organization,
  Account,
  Transaction,
  Receipt,
  CreateTransactionInput,
  TransactionFilters,
  TrialBalanceReport
} from '@/types';
```

## Testing

### Test Database Connection

```typescript
import { healthCheck } from '@/lib/db';

const isHealthy = await healthCheck();
console.log('Database healthy:', isHealthy);
```

### Seed Sample Data

```typescript
import { createSampleOrganization } from '@/lib/db/seed';

const result = await createSampleOrganization();
```

## Migrations

### Create Migration

```bash
npx drizzle-kit generate
```

### Apply Migration

```bash
npx drizzle-kit push
```

### View Database Studio

```bash
npx drizzle-kit studio
```

## Common Patterns

### Filtered Queries

```typescript
// Always filter by organization_id
const data = await db
  .select()
  .from(table)
  .where(eq(table.organizationId, organizationId));
```

### Transactions

```typescript
// Use transactions for multi-step operations
await runTransaction(async (tx) => {
  // Multiple related operations
});
```

### Error Handling

```typescript
try {
  await requireOrganization();
  // Your logic here
} catch (error) {
  console.error('Access denied:', error);
  return unauthorizedResponse();
}
```

## Best Practices

1. **Always filter by organization_id** in queries
2. **Use transactions** for multi-step database operations
3. **Validate double-entry** before posting transactions
4. **Use TypeScript types** from `types/index.ts`
5. **Protect routes** with middleware
6. **Handle errors** gracefully in API routes
7. **Use pre-built queries** when available
8. **Index optimization** for frequently queried columns

## Troubleshooting

### Connection Issues
- Check `DATABASE_URL` in `.env.local`
- Verify Supabase credentials
- Test with `psql $DATABASE_URL`

### Type Errors
- Run `npx drizzle-kit generate` to regenerate types
- Check `drizzle.config.ts` matches your schema

### Auth Issues
- Verify Clerk keys in `.env.local`
- Check middleware configuration
- Test organization selection

## Next Steps

1. Explore `lib/db/queries.ts` for more query examples
2. Review `types/index.ts` for available types
3. Check `DATABASE_SETUP.md` for detailed setup
4. Build your first feature using the schema!

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Clerk Documentation](https://clerk.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Next.js](https://nextjs.org/docs)