# Silverpine Ledger - API Documentation

Complete API documentation for Silverpine Ledger SaaS application.

## Table of Contents
1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Server Actions](#server-actions)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)

## Authentication

Silverpine Ledger uses Clerk for authentication. All API requests require authentication unless explicitly marked as public.

### Authentication Methods

#### 1. Client-Side Authentication
```typescript
import { auth } from '@clerk/nextjs/server';

// In Server Components
export default async function Page() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  // ... rest of component
}
```

#### 2. Server-Side Authentication
```typescript
import { auth } from '@clerk/nextjs/server';

// In API Routes
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  // ... rest of handler
}
```

#### 3. Middleware Protection
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up', '/api/webhooks'],
  ignoredRoutes: ['/api/health'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### User Context
```typescript
import { currentUser } from '@clerk/nextjs/server';

// Get complete user data
const user = await currentUser();
console.log(user.id, user.emailAddresses, user.firstName);
```

## API Endpoints

### Health Check

#### GET /api/health
Check application and database health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-06T10:00:00Z",
  "database": "connected",
  "version": "0.1.0"
}
```

### User Management

#### GET /api/user/profile
Get current user profile with associated businesses.

**Authentication:** Required
**Response:**
```json
{
  "id": "user_xxxxxxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "businesses": [
    {
      "id": "biz_xxxxxxxxx",
      "name": "Acme Corporation",
      "gstin": "29ABCDE1234F1Z5",
      "plan": "professional"
    }
  ]
}
```

#### PUT /api/user/profile
Update user profile information.

**Authentication:** Required
**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_xxxxxxxxx",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

### Business Management

#### GET /api/businesses
Get all businesses for current user.

**Authentication:** Required
**Query Parameters:**
- `include`: Comma-separated related data (e.g., `include=transactions,invoices`)

**Response:**
```json
{
  "businesses": [
    {
      "id": "biz_xxxxxxxxx",
      "name": "Acme Corporation",
      "gstin": "29ABCDE1234F1Z5",
      "plan": "professional",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST /api/businesses
Create a new business.

**Authentication:** Required
**Request Body:**
```json
{
  "name": "Acme Corporation",
  "gstin": "29ABCDE1234F1Z5",
  "businessType": "private_limited",
  "state": "Karnataka",
  "address": {
    "street": "123 Business St",
    "city": "Bangalore",
    "pincode": "560001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "business": {
    "id": "biz_xxxxxxxxx",
    "name": "Acme Corporation",
    "gstin": "29ABCDE1234F1Z5",
    "plan": "free",
    "createdAt": "2026-04-06T10:00:00Z"
  }
}
```

#### GET /api/businesses/[id]
Get specific business details.

**Authentication:** Required
**Response:**
```json
{
  "id": "biz_xxxxxxxxx",
  "name": "Acme Corporation",
  "gstin": "29ABCDE1234F1Z5",
  "businessType": "private_limited",
  "plan": "professional",
  "stats": {
    "totalTransactions": 150,
    "totalInvoices": 45,
    "pendingPayments": 5
  }
}
```

#### PUT /api/businesses/[id]
Update business information.

**Authentication:** Required
**Request Body:**
```json
{
  "name": "Acme Corp Updated",
  "gstin": "29ABCDE1234F1Z5"
}
```

#### DELETE /api/businesses/[id]
Delete a business (and all associated data).

**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "message": "Business deleted successfully"
}
```

### Transactions

#### GET /api/transactions
Get transactions with filtering and pagination.

**Authentication:** Required
**Query Parameters:**
- `businessId`: Filter by business (required)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Transaction type (`income`, `expense`)
- `category`: Filter by category
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_xxxxxxxxx",
      "businessId": "biz_xxxxxxxxx",
      "type": "income",
      "amount": 50000,
      "category": "sales",
      "description": "Invoice payment",
      "date": "2026-04-01T00:00:00Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### POST /api/transactions
Create a new transaction.

**Authentication:** Required
**Request Body:**
```json
{
  "businessId": "biz_xxxxxxxxx",
  "type": "income",
  "amount": 50000,
  "category": "sales",
  "description": "Invoice payment",
  "date": "2026-04-01",
  "paymentMethod": "bank_transfer",
  "gstAmount": 9000,
  "totalAmount": 59000
}
```

#### PUT /api/transactions/[id]
Update a transaction.

**Authentication:** Required
**Request Body:**
```json
{
  "amount": 55000,
  "description": "Updated description"
}
```

#### DELETE /api/transactions/[id]
Delete a transaction.

**Authentication:** Required

### Invoices

#### GET /api/invoices
Get invoices with filtering.

**Authentication:** Required
**Query Parameters:**
- `businessId`: Filter by business (required)
- `status`: Filter by status (`draft`, `sent`, `paid`, `overdue`)
- `from`: Start date
- `to`: End date

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_xxxxxxxxx",
      "invoiceNumber": "INV-001",
      "clientName": "Client Corp",
      "amount": 59000,
      "status": "paid",
      "dueDate": "2026-04-15T00:00:00Z",
      "paidDate": "2026-04-10T00:00:00Z"
    }
  ]
}
```

#### POST /api/invoices
Create a new invoice.

**Authentication:** Required
**Request Body:**
```json
{
  "businessId": "biz_xxxxxxxxx",
  "clientName": "Client Corp",
  "clientEmail": "client@example.com",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "rate": 5000,
      "gstRate": 18
    }
  ],
  "dueDate": "2026-04-15",
  "notes": "Payment due within 15 days"
}
```

#### GET /api/invoices/[id]
Get specific invoice details.

**Authentication:** Required

#### POST /api/invoices/[id]/send
Send invoice to client.

**Authentication:** Required
**Request Body:**
```json
{
  "email": "client@example.com",
  "message": "Please find attached invoice"
}
```

### Bank Statements

#### POST /api/bank-statement/upload
Upload and parse bank statement.

**Authentication:** Required
**Content-Type:** `multipart/form-data`
**Request Body:**
```
file: (binary PDF file)
businessId: biz_xxxxxxxxx
```

**Response:**
```json
{
  "success": true,
  "statementId": "stmt_xxxxxxxxx",
  "transactions": [
    {
      "date": "2026-04-01",
      "description": "NEFT/Credit/ABC Corp",
      "amount": 50000,
      "type": "credit",
      "balance": 150000
    }
  ],
  "summary": {
    "totalCredits": 150000,
    "totalDebits": 50000,
    "transactionsCount": 25
  }
}
```

### Receipt Scanning

#### POST /api/receipts/scan
Scan receipt using AI.

**Authentication:** Required
**Content-Type:** `multipart/form-data`
**Request Body:**
```
file: (binary image file)
businessId: biz_xxxxxxxxx
```

**Response:**
```json
{
  "success": true,
  "receipt": {
    "amount": 2500.50,
    "date": "2026-04-05",
    "merchant": "Amazon India",
    "category": "office_supplies",
    "gstAmount": 380.50,
    "confidence": 0.95
  }
}
```

### Reports

#### GET /api/reports/gst-summary
Generate GST summary report.

**Authentication:** Required
**Query Parameters:**
- `businessId`: Business ID (required)
- `period`: Report period (`monthly`, `quarterly`, `annual`)
- `year`: Financial year
- `month`: Month (for monthly reports)

**Response:**
```json
{
  "period": "April 2026",
  "summary": {
    "totalRevenue": 500000,
    "totalExpenses": 150000,
    "gstCollected": 90000,
    "gstPaid": 27000,
    "netGSTPayable": 63000
  },
  "breakdown": [
    {
      "category": "Sales",
      "amount": 500000,
      "gstCollected": 90000
    }
  ]
}
```

#### GET /api/reports/financial-summary
Generate financial summary.

**Authentication:** Required
**Query Parameters:**
- `businessId`: Business ID (required)
- `period`: Period (`monthly`, `quarterly`, `annual`)

### AI Assistant

#### POST /api/ai/chat
Chat with AI assistant.

**Authentication:** Required
**Request Body:**
```json
{
  "message": "What are my total expenses this month?",
  "businessId": "biz_xxxxxxxxx",
  "context": "financial"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Your total expenses for April 2026 are ₹1,50,000. The top expense categories are: Office Supplies (₹45,000), Travel (₹30,000), and Utilities (₹25,000).",
  "data": {
    "totalExpenses": 150000,
    "topCategories": [
      {"category": "office_supplies", "amount": 45000},
      {"category": "travel", "amount": 30000}
    ]
  }
}
```

## Server Actions

Server Actions are the preferred way to handle mutations in Next.js 14+ App Router.

### User Actions

```typescript
// app/actions/user.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function updateProfile(data: ProfileUpdateData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const updatedUser = await db
    .update(users)
    .set({ ...data })
    .where(eq(users.clerkId, userId))
    .returning();

  return updatedUser[0];
}
```

### Business Actions

```typescript
// app/actions/business.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { businesses } from '@/lib/db/schema';

export async function createBusiness(data: BusinessCreateData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const business = await db
    .insert(businesses)
    .values({
      ...data,
      userId,
      plan: 'free',
    })
    .returning();

  return business[0];
}

export async function getBusinesses() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await db.query.businesses.findMany({
    where: eq(businesses.userId, userId),
  });
}
```

### Transaction Actions

```typescript
// app/actions/transactions.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';

export async function createTransaction(data: TransactionCreateData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify business ownership
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, data.businessId),
  });

  if (!business || business.userId !== userId) {
    throw new Error('Business not found or unauthorized');
  }

  const transaction = await db
    .insert(transactions)
    .values({
      ...data,
      userId,
    })
    .returning();

  return transaction[0];
}

export async function deleteTransaction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error('Transaction not found or unauthorized');
  }

  await db.delete(transactions).where(eq(transactions.id, id));

  return { success: true };
}
```

## Data Models

### User
```typescript
interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Business
```typescript
interface Business {
  id: string;
  userId: string;
  name: string;
  gstin: string;
  businessType: 'sole_proprietor' | 'partnership' | 'private_limited' | 'public_limited';
  plan: 'free' | 'professional' | 'enterprise';
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  businessId: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: string;
  gstAmount?: number;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice
```typescript
interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
}
```

## Error Handling

All API errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | User not authenticated | 401 |
| `FORBIDDEN` | User lacks permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `DUPLICATE_RECORD` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

### Error Handling Example

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Your logic here
    return NextResponse.json({ data: 'success' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Free users | 100 requests | 15 minutes |
| Professional users | 500 requests | 15 minutes |
| Enterprise users | Unlimited | - |

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617200000
```

## Webhooks

### Payment Webhooks

#### POST /api/webhooks/payment
Handle payment gateway webhooks.

**Authentication:** Signature verification
**Request Body:**
```json
{
  "event": "payment.success",
  "data": {
    "paymentId": "pay_xxxxxxxxx",
    "amount": 59000,
    "status": "success",
    "metadata": {
      "invoiceId": "inv_xxxxxxxxx"
    }
  },
  "timestamp": "2026-04-06T10:00:00Z",
  "signature": "sha256=..."
}
```

### Clerk Webhooks

#### POST /api/webhooks/clerk
Handle Clerk authentication events.

**Events:**
- `user.created`
- `user.updated`
- `user.deleted`
- `session.created`
- `session.ended`

---

**Testing API Endpoints:**

Use the included REST Client files or import this collection into Postman for testing all endpoints.

**Need help?** Check the troubleshooting guide or contact the development team.