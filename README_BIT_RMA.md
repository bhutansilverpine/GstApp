# Silverpine Ledger - BIT Export & RMA Payment Integration

This document describes the comprehensive Business Income Tax (BIT) export functionality and RMA (Royal Monetary Authority) payment integration implemented for the Silverpine Ledger SaaS application.

## Table of Contents

1. [BIT Export System](#bit-export-system)
2. [RMA Payment Integration](#rma-payment-integration)
3. [Google Sheets Integration](#google-sheets-integration)
4. [Installation & Setup](#installation--setup)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Bhutan-Specific Features](#bhutan-specific-features)

---

## BIT Export System

The BIT export system generates 100% compliant Bhutan Business Income Tax Excel files for tax filing and reporting purposes.

### Features

- **Multi-Sheet Excel Export**: Generates comprehensive Excel files with multiple sheets
- **BIT Compliance**: Follows Bhutan tax authority requirements and formatting
- **Data Validation**: Comprehensive validation before export generation
- **Preview Functionality**: Review financial data before exporting
- **Wizard Interface**: Step-by-step export process
- **Customizable Options**: Choose which sections to include in exports

### Components

#### Server Components (`server/bit/`)

1. **`export.ts`** - Main export functionality
   - `generateBITExport()` - Generate BIT-compliant Excel files
   - `validateBITExport()` - Validate data before export
   - Includes all required BIT schedules

2. **`templates.ts`** - Excel template definitions
   - Account mappings for BIT categories
   - Formatting configurations
   - Sheet templates for all BIT schedules
   - Helper functions for data transformation

3. **`validation.ts`** - Data validation system
   - Organization information validation
   - Trial balance validation
   - GST compliance checks
   - Account structure validation

#### UI Components (`components/bit/`)

1. **`export-wizard.tsx`** - Step-by-step export wizard
   - Financial year selection
   - Data validation review
   - Export options configuration
   - Progress tracking

2. **`preview.tsx`** - Data preview component
   - Trial balance preview
   - Profit & loss statement preview
   - Balance sheet preview
   - Summary statistics

#### Pages

- **`app/dashboard/bit/page.tsx`** - Main BIT export page

### BIT Excel Schedules

The export includes the following required schedules:

1. **Company Information**
   - Organization name and TPN
   - Contact details
   - GST registration status
   - Financial year information

2. **Trial Balance**
   - Account codes and names
   - Debit and credit balances
   - Running totals
   - Balanced verification

3. **Profit & Loss Statement**
   - Revenue breakdown by category
   - Expense breakdown by category
   - Net profit/loss calculation
   - Year-to-date comparisons

4. **Balance Sheet**
   - Assets (current and fixed)
   - Liabilities (current and long-term)
   - Equity breakdown
   - Balance verification

5. **GST Reconciliation**
   - GST collected on sales
   - GST paid on purchases
   - Net GST calculation
   - GST payable/receivable status

6. **Depreciation Schedule**
   - Fixed asset register
   - Opening balances
   - Additions and disposals
   - Depreciation calculations

---

## RMA Payment Integration

The RMA payment integration enables seamless digital payments through Bhutan's Royal Monetary Authority payment system.

### Features

- **Multiple Payment Methods**: QR code, mobile banking, bank transfer
- **Real-time Status Tracking**: Monitor payment processing status
- **Secure Processing**: RMA-secured payment gateway integration
- **Webhook Notifications**: Automated payment status updates
- **Refund Processing**: Handle refunds and cancellations
- **QR Code Generation**: Instant QR code payments

### Components

#### Server Components (`server/payments/`)

1. **`rma.ts`** - Main RMA payment integration
   - `initializeRMAPayment()` - Start new payment
   - `checkRMAPaymentStatus()` - Check payment status
   - `processRMARefund()` - Process refunds
   - `cancelRMAPayment()` - Cancel pending payments
   - `generateRMAPaymentReport()` - Generate payment reports

2. **`types.ts`** - Type definitions
   - Payment request/response types
   - Status tracking types
   - Webhook event types
   - Error handling types

3. **`webhook.ts`** - Webhook handlers
   - Payment completion events
   - Payment failure events
   - Refund processing events
   - Signature verification

#### UI Components (`components/payments/`)

1. **`payment-form.tsx`** - Payment initiation form
   - Amount and currency selection
   - Payment method selection
   - Customer information capture
   - Terms and conditions

2. **`payment-status.tsx`** - Payment status display
   - Real-time status updates
   - Transaction details
   - Help and support information
   - Status refresh functionality

3. **`qr-code.tsx`** - QR code display
   - Dynamic QR code generation
   - Mobile-friendly display
   - Payment instructions

#### Pages

- **`app/dashboard/payments/page.tsx`** - Payment management page

### Payment Flow

1. **Initialization**
   - User fills payment form
   - System validates payment details
   - Payment request sent to RMA
   - QR code/payment URL generated

2. **Processing**
   - Customer completes payment
   - RMA processes transaction
   - Webhook notifications received
   - Payment status updated

3. **Completion**
   - Payment confirmed
   - Transaction records updated
   - Notifications sent
   - Receipt generated

---

## Google Sheets Integration

The Google Sheets integration provides backup and sync functionality for financial data.

### Features

- **Automated Backups**: Schedule automatic backups to Google Sheets
- **PDF Storage**: Backup PDF documents to Google Drive
- **Real-time Sync**: Sync data between systems
- **Conflict Resolution**: Handle data conflicts intelligently
- **Spreadsheet Management**: Create and manage spreadsheets

### Components

#### Server Components (`server/google/`)

**`sheets.ts`** - Google Sheets integration
- `backupTransactionsToSheets()` - Backup transaction data
- `backupPDFsToDrive()` - Backup PDF files
- `syncTransactionsFromSheets()` - Sync data from sheets
- `getSheetsData()` - Read sheets data
- `createSpreadsheet()` - Create new spreadsheets
- `testGoogleSheetsConnection()` - Test connection

### Backup Features

1. **Transaction Backups**
   - All transaction records
   - Account information
   - Receipt data
   - Bank transactions

2. **PDF Backups**
   - Receipt PDFs
   - Invoice PDFs
   - Financial statements
   - Tax documents

3. **Sync Functionality**
   - Bidirectional sync
   - Conflict detection
   - Automatic resolution
   - Manual override options

---

## Installation & Setup

### Dependencies

The following dependencies are required:

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "qrcode": "^1.5.3",
    "googleapis": "^128.0.0"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# BIT Export Configuration
BIT_EXPORT_ENABLED=true
BIT_VALIDATION_STRICT=true

# RMA Payment Configuration
RMA_MERCHANT_ID=your_merchant_id
RMA_API_KEY=your_api_key
RMA_API_SECRET=your_api_secret
RMA_ENVIRONMENT=sandbox
RMA_WEBHOOK_URL=https://yourdomain.com/api/webhooks/rma
RMA_CALLBACK_URL=https://yourdomain.com/payments/callback

# Google Sheets Configuration
GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

### RMA Payment Setup

1. **Get RMA Merchant Account**
   - Register with Royal Monetary Authority of Bhutan
   - Obtain merchant credentials
   - Configure webhook URLs

2. **Configure Payment Methods**
   - QR code payments
   - Mobile banking integration
   - Bank transfer setup

### Google Sheets Setup

1. **Create Google Service Account**
   - Go to Google Cloud Console
   - Create a new service account
   - Download credentials JSON
   - Enable Google Sheets API and Drive API

2. **Set Up Spreadsheet**
   - Create target spreadsheet
   - Share with service account email
   - Configure sheet structure

3. **Configure Drive Folder** (Optional)
   - Create folder in Google Drive
   - Share with service account
   - Use for PDF backups

---

## Usage

### BIT Export

1. Navigate to `/dashboard/bit`
2. Select financial year
3. Review validation results
4. Choose export options
5. Generate and download Excel file

```typescript
import { generateBITExport } from '@/server/bit/export';

const result = await generateBITExport({
  organizationId: 'org-123',
  financialYearStart: new Date('2024-01-01'),
  financialYearEnd: new Date('2024-12-31'),
  exportOptions: {
    includeTrialBalance: true,
    includeProfitLoss: true,
    includeBalanceSheet: true,
    includeGSTReconciliation: true,
    includeDepreciationSchedule: true,
    includeCompanyInfo: true,
  },
});
```

### RMA Payments

1. Navigate to `/dashboard/payments`
2. Fill payment form
3. Select payment method
4. Complete payment
5. Track payment status

```typescript
import { initializeRMAPayment } from '@/server/payments/rma';

const result = await initializeRMAPayment({
  amount: 1500.00,
  currency: 'BTN',
  description: 'Invoice #12345',
  merchantId: 'merchant-123',
  customerName: 'Tshering Wangdi',
  customerEmail: 'tshering@example.com',
});
```

### Google Sheets Backup

```typescript
import { backupTransactionsToSheets } from '@/server/google/sheets';

const result = await backupTransactionsToSheets(
  'org-123',
  transactions
);
```

---

## API Reference

### BIT Export API

#### `generateBITExport(input: BITExportInput): Promise<BITExportResult>`

Generate a BIT-compliant Excel export.

**Parameters:**
- `organizationId` - Organization ID
- `financialYearStart` - Financial year start date
- `financialYearEnd` - Financial year end date
- `exportOptions` - Export configuration options

**Returns:**
- `success` - Export success status
- `fileName` - Generated file name
- `fileSize` - File size in bytes
- `validation` - Validation results

### RMA Payment API

#### `initializeRMAPayment(request: RMAPaymentRequest): Promise<RMAPaymentResponse>`

Initialize a new RMA payment.

**Parameters:**
- `amount` - Payment amount
- `currency` - Currency code (BTN/USD)
- `description` - Payment description
- `merchantId` - Merchant ID
- `customerName` - Customer name (optional)
- `customerEmail` - Customer email (optional)

**Returns:**
- `success` - Payment initialization status
- `paymentId` - Payment ID
- `paymentUrl` - Payment URL
- `qrCodeData` - QR code data URL
- `status` - Payment status

#### `checkRMAPaymentStatus(paymentId: string): Promise<RMAPaymentStatus>`

Check payment processing status.

**Parameters:**
- `paymentId` - Payment ID to check

**Returns:**
- `status` - Current payment status
- `amount` - Payment amount
- `paidAmount` - Amount paid
- `transactionId` - Transaction ID
- `completedAt` - Completion timestamp

### Google Sheets API

#### `backupTransactionsToSheets(organizationId: string, transactions: any[]): Promise<BackupResult>`

Backup transactions to Google Sheets.

**Parameters:**
- `organizationId` - Organization ID
- `transactions` - Transaction array

**Returns:**
- `success` - Backup success status
- `spreadsheetId` - Spreadsheet ID
- `spreadsheetUrl` - Spreadsheet URL
- `rowsBackedUp` - Number of rows backed up

---

## Bhutan-Specific Features

### Tax Payer Number (TPN)

- **11-digit unique identifier** for businesses in Bhutan
- **Required for all BIT exports** and tax filings
- **Validated during export generation**
- **Format**: XXXXXXXXXXX (11 digits)

### GST Compliance

- **7% GST rate** (configurable per organization)
- **GST reconciliation** in BIT exports
- **GST tracking accounts** (GST collected, GST paid)
- **GST payable/receivable calculations**

### Currency Support

- **BTN (Ngultrum)** - Primary currency
- **USD (US Dollar)** - Secondary currency
- **Currency formatting** for Bhutan
- **Exchange rate tracking**

### Fiscal Year

- **Default fiscal year end**: December 31
- **Configurable per organization**
- **Financial year selection** for exports
- **Year-over-year comparisons**

### Payment Methods

- **QR Code Payments** - Scan with mobile banking apps
- **Mobile Banking** - Direct app integration
- **Bank Transfer** - Traditional bank transfers
- **RMA Integration** - Royal Monetary Authority gateway

### Formatting Standards

- **Date Format**: DD/MM/YYYY
- **Number Format**: #,##0.00
- **Currency Format**: Nu. #,##0.00
- **TPN Format**: XXXXXXXXXXX (11 digits)

---

## Security & Compliance

### Data Protection

- **End-to-end encryption** for payment data
- **Secure storage** of credentials
- **No data retention** beyond necessary period
- **GDPR compliant** data handling

### Payment Security

- **RMA-secured** payment gateway
- **SSL/TLS encryption** for all transactions
- **PCI DSS compliant** payment processing
- **Tokenized payment data**

### Tax Compliance

- **BIT compliant** exports
- **GST reconciliation** features
- **Audit trail** for all transactions
- **Document retention** policies

---

## Troubleshooting

### Common Issues

#### BIT Export Validation Errors

- **Missing TPN**: Ensure organization has valid TPN configured
- **Trial Balance Not Balanced**: Review account balances and journal entries
- **Missing GST Accounts**: Set up GST tracking accounts

#### RMA Payment Issues

- **Payment Timeout**: Check network connectivity and RMA service status
- **Invalid Signature**: Verify API credentials and webhook configuration
- **Payment Failed**: Contact bank or try alternative payment method

#### Google Sheets Sync Issues

- **Authentication Error**: Verify service account credentials
- **Permission Denied**: Ensure service account has access to spreadsheet
- **Quota Exceeded**: Check Google API usage limits

---

## Future Enhancements

### Planned Features

1. **Advanced BIT Features**
   - Multi-year comparison reports
   - Tax calculation optimization
   - Automated tax filing integration
   - Custom tax schedule templates

2. **Enhanced Payment Features**
   - Recurring payments
   - Payment scheduling
   - Multi-currency support
   - Advanced analytics

3. **Improved Integration**
   - Real-time sync capabilities
   - Conflict resolution UI
   - Advanced backup scheduling
   - Data export to other platforms

---

## Support & Contact

For technical support or questions:

- **Email**: support@silverpineledger.bt
- **Phone**: +975 2 345 678
- **Documentation**: https://docs.silverpineledger.bt
- **GitHub**: https://github.com/silverpineledger

---

## License & Copyright

Copyright © 2026 Silverpine Ledger. All rights reserved.

This implementation is proprietary software and may not be copied, modified, or distributed without express written permission from Silverpine Ledger.

---

**Last Updated**: April 2026
**Version**: 1.0.0