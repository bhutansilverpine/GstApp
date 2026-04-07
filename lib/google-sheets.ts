/**
 * Google Sheets API Integration
 *
 * Handles all operations with Google Sheets for receipt and transaction data
 */

import { getGoogleOAuthToken } from "./google-auth";

// ============================================
// Types
// ============================================

export interface SheetData {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
}

export interface ReceiptRowData {
  date: string;
  vendor: string;
  amount: number;
  gstAmount: number;
  tpn?: string;
  category: string;
  description?: string;
  imageUrl?: string;
}

export interface TransactionRowData {
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
}

// ============================================
// API Helper Functions
// ============================================

/**
 * Create a new spreadsheet with proper headers
 */
export async function createSpreadsheet(
  title: string,
  type: "receipts" | "transactions" | "expenses"
): Promise<SheetData> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  // Define headers based on type
  const headers = type === "receipts"
    ? ["Date", "Vendor", "Amount", "GST Amount", "TPN", "Category", "Description", "Image URL"]
    : type === "transactions"
    ? ["Date", "Description", "Debit Account", "Credit Account", "Amount", "Reference"]
    : ["Date", "Category", "Description", "Amount", "GST Claimable", "Payment Method"];

  // Create spreadsheet
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
        timeZone: "Asia/Thimphu",
      },
      sheets: [
        {
          properties: {
            title: "Data",
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0.9, green: 0.9, blue: 1.0 },
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create spreadsheet: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  // Freeze the header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
        ],
      }),
    }
  );

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetName: "Data",
  };
}

/**
 * List all spreadsheets in user's Drive
 */
export async function listSpreadsheets(): Promise<
  Array<{ id: string; name: string; url: string }>
> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  // Search for spreadsheets in Drive
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&orderBy=modifiedTime%20desc&pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list spreadsheets");
  }

  const data = await response.json();

  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    url: `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
  }));
}

/**
 * Append row data to a spreadsheet
 */
export async function appendRow(
  spreadsheetId: string,
  sheetName: string,
  values: (string | number)[]
): Promise<void> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to append row: ${JSON.stringify(error)}`);
  }
}

/**
 * Get all data from a spreadsheet
 */
export async function getSheetData(
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get sheet data");
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Add a new sheet to existing spreadsheet
 */
export async function addSheetToSpreadsheet(
  spreadsheetId: string,
  sheetName: string,
  headers: string[]
): Promise<void> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  // Add new sheet
  const addResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      }),
    }
  );

  if (!addResponse.ok) {
    throw new Error("Failed to add sheet");
  }

  // Add headers to new sheet
  const headerResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          headers.map((h) => h),
        ],
      }),
    }
  );

  if (!headerResponse.ok) {
    throw new Error("Failed to add headers");
  }
}

/**
 * Export formatted expenses table
 */
export async function exportToExpensesSheet(
  sourceSpreadsheetId: string,
  sourceSheetName: string,
  targetSpreadsheetId?: string
): Promise<SheetData> {
  const accessToken = await getGoogleOAuthToken();
  if (!accessToken) throw new Error("Google not connected");

  // If no target specified, create a new one
  let targetId = targetSpreadsheetId;

  if (!targetId) {
    const newSheet = await createSpreadsheet(
      `Expenses Export - ${new Date().toLocaleDateString()}`,
      "expenses"
    );
    targetId = newSheet.spreadsheetId;
  }

  // Get source data
  const sourceData = await getSheetData(sourceSpreadsheetId, sourceSheetName);

  // Skip header row, process data
  const rows = sourceData.slice(1);

  // Append all rows to target
  for (const row of rows) {
    await appendRow(targetId, "Data", row);
  }

  return {
    spreadsheetId: targetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
    sheetName: "Data",
  };
}
