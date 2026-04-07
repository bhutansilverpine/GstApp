import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createSpreadsheet,
  listSpreadsheets,
  appendRow,
  getSheetData,
  addSheetToSpreadsheet,
  exportToExpensesSheet,
} from "@/lib/google-sheets";

/**
 * GET /api/google-sheets - List spreadsheets or get sheet data
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "list") {
      const spreadsheets = await listSpreadsheets();
      return NextResponse.json({ spreadsheets });
    }

    if (action === "getData") {
      const spreadsheetId = searchParams.get("spreadsheetId");
      const sheetName = searchParams.get("sheetName") || "Sheet1";

      if (!spreadsheetId) {
        return NextResponse.json({ error: "spreadsheetId required" }, { status: 400 });
      }

      const data = await getSheetData(spreadsheetId, sheetName);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google-sheets - Create spreadsheet, add row, or export
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { title, type } = body;
      const spreadsheet = await createSpreadsheet(title, type);
      return NextResponse.json(spreadsheet);
    }

    if (action === "appendRow") {
      const { spreadsheetId, sheetName, values } = body;
      await appendRow(spreadsheetId, sheetName, values);
      return NextResponse.json({ success: true });
    }

    if (action === "addSheet") {
      const { spreadsheetId, sheetName, headers } = body;
      await addSheetToSpreadsheet(spreadsheetId, sheetName, headers);
      return NextResponse.json({ success: true });
    }

    if (action === "export") {
      const { sourceSpreadsheetId, sourceSheetName, targetSpreadsheetId } = body;
      const result = await exportToExpensesSheet(
        sourceSpreadsheetId,
        sourceSheetName,
        targetSpreadsheetId
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
