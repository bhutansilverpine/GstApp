/**
 * Google Sheets Integration
 *
 * This file contains server actions for integrating with Google Sheets
 * to backup and sync Silverpine Ledger data.
 */

"use server";

import { google } from "googleapis";
import { Readable } from "stream";

// ============================================
// Types
// ============================================

export interface GoogleSheetsConfig {
  credentials: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
  spreadsheetId?: string;
  folderId?: string;
}

export interface BackupResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetsCreated?: string[];
  rowsBackedUp?: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  rowsSynced?: number;
  lastSyncTime?: Date;
  conflicts?: Array<{
    row: number;
    field: string;
    localValue: any;
    remoteValue: any;
  }>;
  error?: string;
}

export interface SheetsData {
  spreadsheetId: string;
  sheets: Array<{
    name: string;
    data: any[][];
    rowCount: number;
    columnCount: number;
  }>;
}

// ============================================
// Configuration
// ============================================

function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const credentialsJson = process.env.GOOGLE_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
  }

  const credentials = JSON.parse(credentialsJson);

  return {
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
      project_id: credentials.project_id,
    },
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
}

// ============================================
// Authentication
// ============================================

/**
 * Get authenticated Google Sheets client
 */
async function getSheetsClient() {
  const config = getGoogleSheetsConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: config.credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  return { sheets, drive, auth };
}

// ============================================
// Server Actions
// ============================================

/**
 * Backup transactions to Google Sheets
 */
export async function backupTransactionsToSheets(
  organizationId: string,
  transactions: any[]
): Promise<BackupResult> {
  try {
    console.log("Starting Google Sheets backup:", {
      organizationId,
      transactionCount: transactions.length,
    });

    const { sheets, drive } = await getSheetsClient();
    const config = getGoogleSheetsConfig();

    // Create or get spreadsheet
    let spreadsheetId = config.spreadsheetId;

    if (!spreadsheetId) {
      // Create new spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Silverpine Ledger Backup - ${new Date().toISOString().split("T")[0]}`,
          },
        },
      });

      spreadsheetId = spreadsheet.data.spreadsheetId;
      console.log("Created new spreadsheet:", spreadsheetId);

      // Move to folder if specified
      if (config.folderId) {
        await drive.files.update({
          fileId: spreadsheetId,
          addParents: config.folderId,
          fields: "id",
        });
      }
    }

    // Prepare transaction data
    const headers = [
      "ID",
      "Date",
      "Description",
      "Reference",
      "Journal Type",
      "Is Posted",
      "Is Reconciled",
      "Created At",
      "Updated At",
    ];

    const rows = transactions.map(transaction => [
      transaction.id,
      transaction.date,
      transaction.description,
      transaction.reference || "",
      transaction.journalType,
      transaction.isPosted ? "Yes" : "No",
      transaction.isReconciled ? "Yes" : "No",
      transaction.createdAt,
      transaction.updatedAt,
    ]);

    // Clear existing data and add new data
    const sheetName = "Transactions";

    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A1:Z`,
      });
    } catch (error) {
      // Sheet might not exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
    }

    // Add headers and data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers, ...rows],
      },
    });

    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0, // First sheet
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    console.log("Google Sheets backup completed:", {
      spreadsheetId,
      rowsBackedUp: rows.length,
    });

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      sheetsCreated: [sheetName],
      rowsBackedUp: rows.length,
    };

  } catch (error) {
    console.error("Error backing up to Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to backup to Google Sheets",
    };
  }
}

/**
 * Backup PDFs to Google Drive
 */
export async function backupPDFsToDrive(
  organizationId: string,
  pdfs: Array<{
    name: string;
    data: Buffer;
    mimeType: string;
    metadata?: any;
  }>
): Promise<{
  success: boolean;
  filesUploaded?: number;
  folderId?: string;
  folderUrl?: string;
  error?: string;
}> {
  try {
    console.log("Starting Google Drive PDF backup:", {
      organizationId,
      pdfCount: pdfs.length,
    });

    const { drive } = await getSheetsClient();
    const config = getGoogleSheetsConfig();

    // Create folder for PDFs
    const folderName = `Silverpine Ledger PDFs - ${new Date().toISOString().split("T")[0]}`;
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: config.folderId ? [config.folderId] : undefined,
      },
      fields: "id",
    });

    const folderId = folder.data.id!;
    let filesUploaded = 0;

    // Upload each PDF
    for (const pdf of pdfs) {
      try {
        const fileMetadata = {
          name: pdf.name,
          parents: [folderId],
          properties: pdf.metadata,
        };

        const media = {
          mimeType: pdf.mimeType,
          body: Readable.from(pdf.data),
        };

        await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id",
        });

        filesUploaded++;
      } catch (error) {
        console.error("Error uploading PDF:", pdf.name, error);
      }
    }

    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    console.log("Google Drive PDF backup completed:", {
      folderId,
      filesUploaded,
    });

    return {
      success: true,
      filesUploaded,
      folderId,
      folderUrl,
    };

  } catch (error) {
    console.error("Error backing up PDFs to Google Drive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to backup PDFs to Google Drive",
    };
  }
}

/**
 * Sync transactions from Google Sheets
 */
export async function syncTransactionsFromSheets(
  organizationId: string,
  spreadsheetId: string
): Promise<SyncResult> {
  try {
    console.log("Starting Google Sheets sync:", {
      organizationId,
      spreadsheetId,
    });

    const { sheets } = await getSheetsClient();

    // Get data from sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Transactions!A1:Z",
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return {
        success: false,
        error: "No data found in spreadsheet",
      };
    }

    // Parse headers (first row)
    const headers = values[0];
    const rows = values.slice(1);

    console.log("Syncing transactions:", {
      totalRows: rows.length,
      headers,
    });

    // In a real implementation, you would:
    // 1. Parse each row into a transaction object
    // 2. Compare with local database
    // 3. Identify conflicts (if any)
    // 4. Update local database with remote changes
    // 5. Handle conflict resolution based on timestamps

    const transactions = rows.map(row => {
      const transaction: any = {};
      headers.forEach((header, index) => {
        const camelCaseKey = header.toLowerCase().replace(/\s+/g, "_");
        transaction[camelCaseKey] = row[index];
      });
      return transaction;
    });

    // TODO: Implement actual sync logic with database
    // For now, just return the parsed data

    console.log("Google Sheets sync completed:", {
      rowsSynced: transactions.length,
    });

    return {
      success: true,
      rowsSynced: transactions.length,
      lastSyncTime: new Date(),
      conflicts: [], // Would contain actual conflicts if any
    };

  } catch (error) {
    console.error("Error syncing from Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync from Google Sheets",
    };
  }
}

/**
 * Get data from Google Sheets
 */
export async function getSheetsData(spreadsheetId: string): Promise<{
  success: boolean;
  data?: SheetsData;
  error?: string;
}> {
  try {
    const { sheets } = await getSheetsClient();

    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetTitles = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || [];

    const sheetsData = await Promise.all(
      sheetTitles.map(async sheetName => {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:Z`,
        });

        const values = response.data.values || [];
        return {
          name: sheetName,
          data: values,
          rowCount: values.length,
          columnCount: values[0]?.length || 0,
        };
      })
    );

    return {
      success: true,
      data: {
        spreadsheetId,
        sheets: sheetsData,
      },
    };

  } catch (error) {
    console.error("Error getting sheets data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get sheets data",
    };
  }
}

/**
 * Create new spreadsheet
 */
export async function createSpreadsheet(title: string): Promise<{
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}> {
  try {
    const { sheets, drive } = await getSheetsClient();
    const config = getGoogleSheetsConfig();

    // Create spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Move to folder if specified
    if (config.folderId) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: config.folderId,
        fields: "id",
      });
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    console.log("Created spreadsheet:", { spreadsheetId, title });

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };

  } catch (error) {
    console.error("Error creating spreadsheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create spreadsheet",
    };
  }
}

/**
 * Test Google Sheets connection
 */
export async function testGoogleSheetsConnection(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { sheets, drive } = await getSheetsClient();

    // Test sheets API
    await sheets.spreadsheets.get({
      spreadsheetId: "1BxiMVs0XRA5nFMdKbBdB_3ceS4oBkYNLIdy4nF7tEQg", // Example spreadsheet
    });

    // Test drive API
    await drive.files.list({
      pageSize: 1,
      fields: "files(id, name)",
    });

    return {
      success: true,
      message: "Google Sheets connection successful",
    };

  } catch (error) {
    console.error("Google Sheets connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}