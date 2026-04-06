# BIT Export & RMA Payment Integration - Usage Examples

This document provides comprehensive examples for using the BIT export system and RMA payment integration.

## Table of Contents

1. [BIT Export Examples](#bit-export-examples)
2. [RMA Payment Examples](#rma-payment-examples)
3. [Google Sheets Examples](#google-sheets-examples)
4. [Integration Examples](#integration-examples)

---

## BIT Export Examples

### Basic BIT Export

```typescript
import { generateBITExport } from '@/server/bit/export';

// Generate a basic BIT export for the current financial year
const result = await generateBITExport({
  organizationId: 'org-123',
  financialYearStart: new Date('2024-01-01'),
  financialYearEnd: new Date('2024-12-31'),
});

if (result.success) {
  console.log('Export generated:', result.fileName);
  console.log('File size:', result.fileSize);
} else {
  console.error('Export failed:', result.error);
}
```

### Custom BIT Export Options

```typescript
// Generate BIT export with custom options
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

### Validate Before Export

```typescript
import { validateBITExport } from '@/server/bit/export';

// Validate data before generating export
const validation = await validateBITExport({
  organizationId: 'org-123',
  financialYearStart: new Date('2024-01-01'),
  financialYearEnd: new Date('2024-12-31'),
});

if (validation.canProceed) {
  console.log('Data is valid for export');
} else {
  console.error('Validation errors:', validation.errors);
  console.warn('Validation warnings:', validation.warnings);
}
```

### Export for Previous Financial Year

```typescript
// Generate export for previous financial year
const lastYear = new Date().getFullYear() - 1;

const result = await generateBITExport({
  organizationId: 'org-123',
  financialYearStart: new Date(`${lastYear}-01-01`),
  financialYearEnd: new Date(`${lastYear}-12-31`),
});
```

### Custom Date Range Export

```typescript
// Generate export for custom date range
const result = await generateBITExport({
  organizationId: 'org-123',
  financialYearStart: new Date('2024-04-01'), // Custom fiscal year
  financialYearEnd: new Date('2025-03-31'),
});
```

---

## RMA Payment Examples

### Initialize Basic Payment

```typescript
import { initializeRMAPayment } from '@/server/payments/rma';

// Initialize a basic payment
const payment = await initializeRMAPayment({
  amount: 1500.00,
  currency: 'BTN',
  description: 'Invoice #INV-2024-001',
  merchantId: 'merchant-123',
});

if (payment.success) {
  console.log('Payment initialized:', payment.paymentId);
  console.log('QR Code URL:', payment.qrCodeUrl);
}
```

### Payment with Customer Information

```typescript
// Initialize payment with customer details
const payment = await initializeRMAPayment({
  amount: 2500.00,
  currency: 'BTN',
  description: 'Service payment - Project Alpha',
  merchantId: 'merchant-123',
  customerName: 'Tshering Wangdi',
  customerEmail: 'tshering.wangdi@example.com',
  customerPhone: '+975 17 123 456',
  reference: 'INV-2024-001',
});
```

### Payment with Custom Expiry

```typescript
// Initialize payment with custom expiry time
const payment = await initializeRMAPayment({
  amount: 5000.00,
  currency: 'USD',
  description: 'International consulting fee',
  merchantId: 'merchant-123',
  expiryMinutes: 60, // 1 hour expiry
});
```

### Check Payment Status

```typescript
import { checkRMAPaymentStatus } from '@/server/payments/rma';

// Check payment status
const status = await checkRMAPaymentStatus('PAY-1712345678-ABC123');

console.log('Payment status:', status.status);
console.log('Amount:', status.amount);
console.log('Paid amount:', status.paidAmount);
console.log('Transaction ID:', status.transactionId);
```

### Poll Payment Status

```typescript
// Poll payment status until completion
async function waitForPaymentCompletion(paymentId: string, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkRMAPaymentStatus(paymentId);

    if (status.status === 'completed') {
      return status;
    } else if (status.status === 'failed') {
      throw new Error(status.failedReason || 'Payment failed');
    }

    // Wait 10 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  throw new Error('Payment timeout');
}

// Usage
try {
  const completedPayment = await waitForPaymentCompletion('PAY-1712345678-ABC123');
  console.log('Payment completed:', completedPayment);
} catch (error) {
  console.error('Payment failed or timed out:', error);
}
```

### Process Refund

```typescript
import { processRMARefund } from '@/server/payments/rma';

// Process a full refund
const refund = await processRMARefund({
  paymentId: 'PAY-1712345678-ABC123',
  amount: 1500.00,
  reason: 'Customer requested refund',
  reference: 'REFUND-2024-001',
});

if (refund.success) {
  console.log('Refund processed:', refund.refundId);
}
```

### Process Partial Refund

```typescript
// Process a partial refund
const refund = await processRMARefund({
  paymentId: 'PAY-1712345678-ABC123',
  amount: 500.00, // Partial refund amount
  reason: 'Partial service refund',
  reference: 'REFUND-2024-002',
});
```

### Cancel Pending Payment

```typescript
import { cancelRMAPayment } from '@/server/payments/rma';

// Cancel a pending payment
const result = await cancelRMAPayment('PAY-1712345678-ABC123');

if (result.success) {
  console.log('Payment cancelled successfully');
} else {
  console.error('Cancellation failed:', result.error);
}
```

---

## Google Sheets Examples

### Backup Transactions

```typescript
import { backupTransactionsToSheets } from '@/server/google/sheets';

// Backup all transactions for an organization
const result = await backupTransactionsToSheets(
  'org-123',
  transactions // Array of transaction objects
);

if (result.success) {
  console.log('Backup completed:', result.spreadsheetUrl);
  console.log('Rows backed up:', result.rowsBackedUp);
}
```

### Backup PDFs to Drive

```typescript
import { backupPDFsToDrive } from '@/server/google/sheets';

// Backup PDF receipts to Google Drive
const pdfs = [
  {
    name: 'receipt-001.pdf',
    data: Buffer.from(pdfData), // PDF file data
    mimeType: 'application/pdf',
    metadata: {
      vendor: 'ABC Store',
      date: '2024-01-15',
      amount: 2500.00,
    },
  },
  // Add more PDFs...
];

const result = await backupPDFsToDrive('org-123', pdfs);

if (result.success) {
  console.log('PDFs backed up:', result.folderUrl);
  console.log('Files uploaded:', result.filesUploaded);
}
```

### Sync from Google Sheets

```typescript
import { syncTransactionsFromSheets } from '@/server/google/sheets';

// Sync transactions from Google Sheets
const result = await syncTransactionsFromSheets(
  'org-123',
  '1BxiMVs0XRA5nFMdKbBdB_3ceS4oBkYNLIdy4nF7tEQg'
);

if (result.success) {
  console.log('Sync completed:', result.rowsSynced);
  console.log('Last sync:', result.lastSyncTime);

  if (result.conflicts && result.conflicts.length > 0) {
    console.log('Conflicts detected:', result.conflicts);
  }
}
```

### Create New Spreadsheet

```typescript
import { createSpreadsheet } from '@/server/google/sheets';

// Create a new spreadsheet for backups
const result = await createSpreadsheet('Silverpine Ledger - 2024 Backup');

if (result.success) {
  console.log('Spreadsheet created:', result.spreadsheetUrl);
  console.log('Spreadsheet ID:', result.spreadsheetId);
}
```

### Get Sheets Data

```typescript
import { getSheetsData } from '@/server/google/sheets';

// Read data from Google Sheets
const result = await getSheetsData('1BxiMVs0XRA5nFMdKbBdB_3ceS4oBkYNLIdy4nF7tEQg');

if (result.success && result.data) {
  console.log('Sheets:', result.data.sheets.length);

  result.data.sheets.forEach(sheet => {
    console.log(`Sheet: ${sheet.name}`);
    console.log(`Rows: ${sheet.rowCount}`);
    console.log(`Columns: ${sheet.columnCount}`);
  });
}
```

### Test Connection

```typescript
import { testGoogleSheetsConnection } from '@/server/google/sheets';

// Test Google Sheets connection
const result = await testGoogleSheetsConnection();

if (result.success) {
  console.log('Connection successful:', result.message);
} else {
  console.error('Connection failed:', result.error);
}
```

---

## Integration Examples

### Complete Payment Workflow

```typescript
import { initializeRMAPayment, checkRMAPaymentStatus } from '@/server/payments/rma';

async function processPaymentWorkflow(
  amount: number,
  description: string,
  customerInfo: any
) {
  try {
    // Step 1: Initialize payment
    console.log('Initializing payment...');
    const payment = await initializeRMAPayment({
      amount,
      currency: 'BTN',
      description,
      merchantId: 'merchant-123',
      ...customerInfo,
    });

    if (!payment.success) {
      throw new Error(payment.error || 'Payment initialization failed');
    }

    console.log('Payment initialized:', payment.paymentId);

    // Step 2: Display QR code to customer
    // (In a real implementation, this would be shown in the UI)
    console.log('QR Code URL:', payment.qrCodeUrl);

    // Step 3: Wait for payment completion
    console.log('Waiting for payment...');
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await checkRMAPaymentStatus(payment.paymentId!);

      if (status.status === 'completed') {
        console.log('Payment completed successfully!');
        return {
          success: true,
          paymentId: payment.paymentId,
          transactionId: status.transactionId,
          amount: status.amount,
        };
      } else if (status.status === 'failed') {
        throw new Error(status.failedReason || 'Payment failed');
      }

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Payment timeout');

  } catch (error) {
    console.error('Payment workflow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Usage
const result = await processPaymentWorkflow(
  2500.00,
  'Invoice #INV-2024-001',
  {
    customerName: 'Tshering Wangdi',
    customerEmail: 'tshering@example.com',
    customerPhone: '+975 17 123 456',
  }
);
```

### Automated Backup Workflow

```typescript
import { backupTransactionsToSheets, backupPDFsToDrive } from '@/server/google/sheets';

async function performAutomatedBackup(organizationId: string) {
  try {
    console.log('Starting automated backup...');

    // Step 1: Fetch data to backup
    // (In a real implementation, you would fetch from your database)
    const transactions = await fetchTransactionsForBackup(organizationId);
    const pdfs = await fetchPDFsForBackup(organizationId);

    // Step 2: Backup transactions to Google Sheets
    console.log('Backing up transactions...');
    const sheetsResult = await backupTransactionsToSheets(
      organizationId,
      transactions
    );

    if (!sheetsResult.success) {
      throw new Error(sheetsResult.error || 'Sheets backup failed');
    }

    console.log('Transactions backed up:', sheetsResult.rowsBackedUp);

    // Step 3: Backup PDFs to Google Drive
    console.log('Backing up PDFs...');
    const driveResult = await backupPDFsToDrive(
      organizationId,
      pdfs
    );

    if (!driveResult.success) {
      throw new Error(driveResult.error || 'Drive backup failed');
    }

    console.log('PDFs backed up:', driveResult.filesUploaded);

    // Step 4: Log backup completion
    console.log('Backup completed successfully');
    return {
      success: true,
      spreadsheetUrl: sheetsResult.spreadsheetUrl,
      folderUrl: driveResult.folderUrl,
      transactionsBackedUp: sheetsResult.rowsBackedUp,
      pdfsBackedUp: driveResult.filesUploaded,
    };

  } catch (error) {
    console.error('Backup workflow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Usage
const result = await performAutomatedBackup('org-123');
```

### Scheduled BIT Export

```typescript
import { generateBITExport } from '@/server/bit/export';

async function generateScheduledBITExports() {
  const organizations = await getAllActiveOrganizations();

  for (const org of organizations) {
    try {
      console.log(`Generating BIT export for ${org.name}...`);

      // Get fiscal year end for organization
      const fiscalYearEnd = getFiscalYearEnd(org);

      const result = await generateBITExport({
        organizationId: org.id,
        financialYearStart: getFiscalYearStart(fiscalYearEnd),
        financialYearEnd: fiscalYearEnd,
      });

      if (result.success) {
        console.log(`BIT export generated for ${org.name}`);
        // Send notification to organization admin
        await notifyAdmin(org.id, {
          type: 'BIT_EXPORT_COMPLETED',
          fileName: result.fileName,
          fileSize: result.fileSize,
        });
      } else {
        console.error(`BIT export failed for ${org.name}:`, result.error);
      }

    } catch (error) {
      console.error(`Error processing ${org.name}:`, error);
    }
  }
}

// Run this function on a schedule (e.g., using cron jobs)
```

---

## Error Handling Examples

### Handle BIT Export Errors

```typescript
import { generateBITExport } from '@/server/bit/export';

async function safeBITExport(input: BITExportInput) {
  try {
    const result = await generateBITExport(input);

    if (!result.success) {
      // Handle validation errors
      if (result.validation) {
        console.error('Validation errors:', result.validation.errors);
        console.warn('Validation warnings:', result.validation.warnings);

        // Decide whether to proceed despite warnings
        if (result.validation.errors.length === 0) {
          console.log('Proceeding with export despite warnings');
        }
      } else {
        // Handle other errors
        console.error('Export failed:', result.error);
        throw new Error(result.error);
      }
    }

    return result;

  } catch (error) {
    console.error('Unexpected error during BIT export:', error);
    throw error;
  }
}
```

### Handle Payment Errors

```typescript
import { initializeRMAPayment } from '@/server/payments/rma';

async function safePaymentInitialization(request: RMAPaymentRequest) {
  try {
    const result = await initializeRMAPayment(request);

    if (!result.success) {
      // Handle different error scenarios
      if (result.error?.includes('insufficient')) {
        throw new Error('Insufficient funds in account');
      } else if (result.error?.includes('timeout')) {
        throw new Error('Payment gateway timeout. Please try again');
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    }

    return result;

  } catch (error) {
    console.error('Payment initialization error:', error);

    // Log error for monitoring
    await logPaymentError({
      type: 'INITIALIZATION_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });

    throw error;
  }
}
```

---

## Testing Examples

### Test BIT Export Validation

```typescript
import { validateBITExport } from '@/server/bit/export';

async function testBITValidation() {
  const testCases = [
    {
      name: 'Valid organization with TPN',
      organizationId: 'test-org-1',
      expected: true,
    },
    {
      name: 'Organization without TPN',
      organizationId: 'test-org-2',
      expected: false,
    },
    {
      name: 'Organization with incomplete data',
      organizationId: 'test-org-3',
      expected: false,
    },
  ];

  for (const testCase of testCases) {
    const result = await validateBITExport({
      organizationId: testCase.organizationId,
      financialYearStart: new Date('2024-01-01'),
      financialYearEnd: new Date('2024-12-31'),
    });

    console.log(`${testCase.name}:`, result.canProceed === testCase.expected ? 'PASS' : 'FAIL');
  }
}
```

### Test Payment Integration

```typescript
import { initializeRMAPayment, checkRMAPaymentStatus, cancelRMAPayment } from '@/server/payments/rma';

async function testPaymentIntegration() {
  console.log('Testing payment integration...');

  // Test 1: Initialize payment
  const payment = await initializeRMAPayment({
    amount: 100.00, // Small amount for testing
    currency: 'BTN',
    description: 'Test payment',
    merchantId: 'test-merchant',
  });

  if (!payment.success) {
    console.error('Payment initialization test failed');
    return;
  }

  console.log('Payment initialized:', payment.paymentId);

  // Test 2: Check payment status
  const status = await checkRMAPaymentStatus(payment.paymentId!);
  console.log('Payment status:', status.status);

  // Test 3: Cancel test payment
  const cancelResult = await cancelRMAPayment(payment.paymentId!);
  console.log('Payment cancellation:', cancelResult.success ? 'PASS' : 'FAIL');
}
```

---

## Best Practices

### BIT Export Best Practices

1. **Always validate before exporting**
   ```typescript
   const validation = await validateBITExport(input);
   if (!validation.canProceed) {
     // Handle validation errors
   }
   ```

2. **Use appropriate financial year ranges**
   ```typescript
   // Correct: Full fiscal year
   financialYearStart: new Date('2024-01-01'),
   financialYearEnd: new Date('2024-12-31'),
   ```

3. **Handle validation warnings appropriately**
   ```typescript
   if (validation.warnings.length > 0) {
     // Log warnings but proceed if acceptable
     console.warn('Validation warnings:', validation.warnings);
   }
   ```

### Payment Best Practices

1. **Always handle payment status updates**
   ```typescript
   // Implement webhook handlers for payment status updates
   ```

2. **Use appropriate expiry times**
   ```typescript
   expiryMinutes: 30, // 30 minutes is typically sufficient
   ```

3. **Implement retry logic for failed payments**
   ```typescript
   // Retry failed payments with exponential backoff
   ```

4. **Always verify payment completion**
   ```typescript
   const status = await checkRMAPaymentStatus(paymentId);
   if (status.status !== 'completed') {
     throw new Error('Payment not completed');
   }
   ```

### Backup Best Practices

1. **Schedule regular automated backups**
   ```typescript
   // Use cron jobs or scheduled functions
   ```

2. **Implement incremental backups**
   ```typescript
   // Only backup new or changed data
   ```

3. **Monitor backup success rates**
   ```typescript
   // Log and alert on backup failures
   ```

---

**Last Updated**: April 2026
**Version**: 1.0.0