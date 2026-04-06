"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, receipts, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import type {
  CreateReceiptInput,
  ReceiptExtractedData,
  ReceiptLineItem,
  ApiResponse,
} from "@/types";

// Initialize Supabase client for file storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Types for extracted receipt data
interface ExtractedReceipt {
  bill_no: string;
  vendor: string;
  tpn: string;
  date: string;
  category: string;
  amount: number;
}

interface ProcessReceiptResult {
  success: boolean;
  receipts?: CreateReceiptInput[];
  error?: string;
  summary?: {
    totalReceipts: number;
    totalAmount: number;
    gstClaimable: number;
  };
}

/**
 * Process PDF receipts using Gemini AI
 * Extracts receipt data and creates unverified records in the database
 */
export async function processReceipts(
  formData: FormData,
  organizationId: string
): Promise<ProcessReceiptResult> {
  try {
    // Validate organization exists
    const orgCheck = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!orgCheck.length) {
      return {
        success: false,
        error: "Organization not found",
      };
    }

    // Get PDF file from form data
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "Only PDF files are supported",
      };
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 10MB limit",
      };
    }

    console.log(`Processing receipt file: ${file.name} (${file.size} bytes)`);

    // Convert file to base64 for Gemini API
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    // Upload to Supabase Storage
    const fileName = `${organizationId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return {
        success: false,
        error: "Failed to upload file to storage",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    const documentUrl = urlData.publicUrl;

    // Call Gemini API with optimized prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Extract all individual receipts from this PDF document.
Return a CSV with these exact headers: bill_no, vendor, tpn, date, category, amount

CRITICAL RULES:
1. bill_no: Invoice/bill number (e.g., "INV-001", "12345")
2. vendor: Vendor/store name (e.g., "Tashi Mart", "FUEL Station")
3. tpn: Tax Payer Number - extract if present, otherwise leave empty (e.g., "123456789" or "")
4. date: Transaction date in DD-MMM-YY format (e.g., "15-Mar-25")
5. category: Transaction category based on vendor type (e.g., "FUEL", "FOOD", "OFFICE SUPPLIES", "UTILITIES", "MISCELLANEOUS")
6. amount: Total amount as a plain number without currency symbols or commas (e.g., "1500.00" not "Nu. 1,500.00")

ADDITIONAL INSTRUCTIONS:
- If TPN is missing or not found, leave the field blank (not "null" or "N/A")
- Output ONLY the raw CSV content without markdown code blocks
- Ensure all dates are in DD-MMM-YY format
- Categories should be: FUEL, FOOD, OFFICE SUPPLIES, UTILITIES, TRANSPORT, MISCELLANEOUS, or similar
- Extract ALL receipts from the document
- Handle multi-page PDFs completely`;

    console.log("Sending request to Gemini API...");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean markdown code blocks if AI included them
    const cleanCsv = text
      .replace(/```csv/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("Extracted CSV data:", cleanCsv.substring(0, 200) + "...");

    // Parse CSV data
    const lines = cleanCsv.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    // Validate CSV headers
    const requiredHeaders = ["bill_no", "vendor", "tpn", "date", "category", "amount"];
    const hasAllHeaders = requiredHeaders.every((h) =>
      headers.some((header) => header.toLowerCase().includes(h))
    );

    if (!hasAllHeaders) {
      return {
        success: false,
        error: "Invalid CSV format returned by AI. Missing required headers.",
      };
    }

    // Parse receipt data
    const extractedReceipts: ExtractedReceipt[] = [];
    let totalAmount = 0;
    let gstClaimable = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV parsing with quoted fields
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length < 6) continue;

      const [
        rawBillNo,
        rawVendor,
        rawTpn,
        rawDate,
        rawCategory,
        rawAmount,
      ] = values;

      // Clean and parse data
      const billNo = rawBillNo?.trim() || "";
      const vendor = rawVendor?.trim() || "";
      const tpn = rawTpn?.trim() || "";
      const date = rawDate?.trim() || "";
      const category = rawCategory?.trim() || "MISCELLANEOUS";

      // Parse amount - remove currency symbols and commas
      const amountStr = rawAmount
        ?.replace(/Nu\.?/g, "")
        .replace(/,/g, "")
        .trim() || "0";
      const amount = parseFloat(amountStr) || 0;

      if (amount > 0) {
        extractedReceipts.push({
          bill_no: billNo,
          vendor: vendor,
          tpn: tpn,
          date: date,
          category: category,
          amount: amount,
        });

        totalAmount += amount;

        // Calculate 7% GST if TPN is present
        if (tpn && tpn.length > 0 && tpn.toLowerCase() !== "null" && tpn.toLowerCase() !== "n/a") {
          gstClaimable += amount * 0.07;
        }
      }
    }

    console.log(`Extracted ${extractedReceipts.length} receipts`);

    if (extractedReceipts.length === 0) {
      return {
        success: false,
        error: "No receipts could be extracted from the document",
      };
    }

    // Create receipt records in database
    const receiptInputs: CreateReceiptInput[] = [];

    for (const extracted of extractedReceipts) {
      // Parse date
      let receiptDate: Date | undefined;
      try {
        // Handle various date formats
        if (extracted.date.includes("-")) {
          const parts = extracted.date.split("-");
          if (parts.length === 3) {
            const months: { [key: string]: string } = {
              Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
              Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
            };
            const day = parts[0].padStart(2, "0");
            const month = months[parts[1]] || "01";
            const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
            receiptDate = new Date(`${year}-${month}-${day}`);
          }
        }
      } catch (error) {
        console.error("Date parsing error:", error);
      }

      // Calculate GST
      const hasTpn = extracted.tpn &&
        extracted.tpn.length > 0 &&
        extracted.tpn.toLowerCase() !== "null" &&
        extracted.tpn.toLowerCase() !== "n/a";
      const gstAmount = hasTpn ? extracted.amount * 0.07 : 0;
      const subtotal = extracted.amount - gstAmount;

      // Prepare extracted data metadata
      const extractedData: ReceiptExtractedData = {
        confidence: 0.85,
        extractionMethod: "gemini-2.0-flash-exp",
        rawText: `${extracted.bill_no},${extracted.vendor},${extracted.tpn},${extracted.date},${extracted.category},${extracted.amount}`,
      };

      const receiptInput: CreateReceiptInput = {
        organizationId: organizationId,
        vendorName: extracted.vendor,
        vendorTpn: extracted.tpn || undefined,
        date: receiptDate,
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalAmount: extracted.amount,
        currency: "BTN",
        category: extracted.category,
        description: `Bill No: ${extracted.bill_no}`,
        documentUrl: documentUrl,
        status: "pending",
        extractedData: extractedData,
      };

      receiptInputs.push(receiptInput);
    }

    // Insert receipts into database
    const insertedReceipts = await db
      .insert(receipts)
      .values(receiptInputs)
      .returning();

    console.log(`Created ${insertedReceipts.length} receipt records`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/receipts`);

    return {
      success: true,
      receipts: receiptInputs,
      summary: {
        totalReceipts: extractedReceipts.length,
        totalAmount: totalAmount,
        gstClaimable: gstClaimable,
      },
    };
  } catch (error) {
    console.error("Receipt processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process receipts",
    };
  }
}

/**
 * Process a single receipt image (for mobile/web upload)
 */
export async function processSingleReceipt(
  formData: FormData,
  organizationId: string
): Promise<ApiResponse<{ receipt: CreateReceiptInput }>> {
  try {
    // Validate organization exists
    const orgCheck = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!orgCheck.length) {
      return {
        success: false,
        error: "Organization not found",
      };
    }

    // Get file from form data
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Support both PDF and images
    const supportedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Only PDF, JPEG, PNG, and WebP files are supported",
      };
    };

    // Validate file size (max 5MB for single receipt)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 5MB limit",
      };
    }

    console.log(`Processing single receipt: ${file.name} (${file.size} bytes)`);

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    // Upload to Supabase Storage
    const fileName = `${organizationId}/single/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return {
        success: false,
        error: "Failed to upload file to storage",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    const documentUrl = urlData.publicUrl;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Extract receipt information from this ${file.type === "application/pdf" ? "PDF" : "image"}.
Return the data in JSON format with these fields:
{
  "bill_no": "invoice number",
  "vendor": "vendor/store name",
  "tpn": "tax payer number (empty string if not found)",
  "date": "transaction date in DD-MMM-YY format",
  "category": "transaction category (FUEL, FOOD, OFFICE SUPPLIES, UTILITIES, TRANSPORT, MISCELLANEOUS)",
  "amount": "total amount as number",
  "line_items": [
    {"description": "item description", "quantity": 1, "unit_price": 100, "amount": 100}
  ]
}

RULES:
- Extract ALL line items if present
- TPN should be empty string if not found
- Amount should be a plain number
- Output ONLY valid JSON, no markdown formatting`;

    console.log("Sending request to Gemini API...");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean markdown code blocks
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let extractedData: any;
    try {
      extractedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        success: false,
        error: "Failed to parse AI response as JSON",
      };
    }

    // Parse date
    let receiptDate: Date | undefined;
    try {
      if (extractedData.date && extractedData.date.includes("-")) {
        const parts = extractedData.date.split("-");
        if (parts.length === 3) {
          const months: { [key: string]: string } = {
            Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
            Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
          };
          const day = parts[0].padStart(2, "0");
          const month = months[parts[1]] || "01";
          const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
          receiptDate = new Date(`${year}-${month}-${day}`);
        }
      }
    } catch (error) {
      console.error("Date parsing error:", error);
    }

    // Calculate GST
    const hasTpn = extractedData.tpn &&
      extractedData.tpn.length > 0 &&
      extractedData.tpn.toLowerCase() !== "null" &&
      extractedData.tpn.toLowerCase() !== "n/a";
    const gstAmount = hasTpn ? extractedData.amount * 0.07 : 0;
    const subtotal = extractedData.amount - gstAmount;

    // Prepare receipt input
    const receiptInput: CreateReceiptInput = {
      organizationId: organizationId,
      vendorName: extractedData.vendor,
      vendorTpn: extractedData.tpn || undefined,
      date: receiptDate,
      subtotal: subtotal,
      gstAmount: gstAmount,
      totalAmount: extractedData.amount,
      currency: "BTN",
      category: extractedData.category,
      description: `Bill No: ${extractedData.bill_no}`,
      documentUrl: documentUrl,
      status: "pending",
      extractedData: {
        confidence: 0.9,
        extractionMethod: "gemini-2.0-flash-exp",
        rawText: JSON.stringify(extractedData),
        lineItems: extractedData.line_items || [],
      },
    };

    // Insert receipt into database
    const insertedReceipt = await db
      .insert(receipts)
      .values(receiptInput)
      .returning();

    console.log(`Created receipt record: ${insertedReceipt[0].id}`);

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/receipts`);

    return {
      success: true,
      data: { receipt: receiptInput },
    };
  } catch (error) {
    console.error("Single receipt processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process receipt",
    };
  }
}
