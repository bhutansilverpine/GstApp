import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface ExtractedReceiptData {
  date: string;
  vendor: string;
  amount: number;
  gstAmount: number;
  tpn?: string;
  category: string;
  description?: string;
}

/**
 * Extract receipt data using Vision API
 */
async function extractFromImage(imageBuffer: Buffer): Promise<ExtractedReceiptData> {
  // Use Google Cloud Vision API for text extraction
  const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!visionApiKey) {
    throw new Error("Google Cloud Vision API key not configured");
  }

  // Convert image to base64
  const base64Image = imageBuffer.toString("base64");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "TEXT_DETECTION",
                maxResults: 50,
              },
              {
                type: "DOCUMENT_TEXT_DETECTION",
                maxResults: 50,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Vision API error:", error);
    throw new Error("Failed to extract text from image");
  }

  const result = await response.json();
  const fullTextAnnotation = result.responses[0]?.fullTextAnnotation;

  if (!fullTextAnnotation) {
    throw new Error("No text found in image");
  }

  const text = fullTextAnnotation.text;
  console.log("Extracted text:", text);

  // Parse the extracted text to get receipt data
  return parseReceiptText(text);
}

/**
 * Parse receipt text to extract structured data
 */
function parseReceiptText(text: string): ExtractedReceiptData {
  const lines = text.split("\n").filter((l) => l.trim());

  // Initialize with defaults
  const data: ExtractedReceiptData = {
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    amount: 0,
    gstAmount: 0,
    category: "General",
    description: "",
  };

  // Try to find date (multiple formats)
  const datePatterns = [
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
    /(\d{1,2}\.\d{1,2}\.\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          data.date = date.toISOString().split("T")[0];
          break;
        }
      } catch {}
    }
  }

  // Try to find total amount
  // Look for "Total:", "TOTAL", "Amount", "Nu.", etc.
  const totalPatterns = [
    /(?:Total|TOTAL|Amount|AMOUNT)[:\s]*Nu\.?\s*([\d,]+\.?\d*)/,
    /Nu\.?\s*([\d,]+\.?\d*)\s*(?:Total|TOTAL)/,
    /(?:रु|Nu\.?)\s*([\d,]+\.?\d*)/,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, "")) || 0;
      break;
    }
  }

  // Calculate GST (15% of total if GST registered)
  if (data.amount > 0) {
    data.gstAmount = Math.round((data.amount * 15) / 115 * 100) / 100;
  }

  // Try to find vendor name
  // Usually first line or before "Address" or "Phone"
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && !line.match(/^\d/) && !line.toLowerCase().includes("receipt")) {
      data.vendor = line.trim();
      break;
    }
  }

  // Try to find TPN (Taxpayer Number)
  const tpnMatch = text.match(/TPN[:\s]*(\d{11})/i);
  if (tpnMatch) {
    data.tpn = tpnMatch[1];
  }

  // Determine category based on vendor/amount keywords
  const lowerText = text.toLowerCase();
  if (lowerText.includes("restaurant") || lowerText.includes("cafe") || lowerText.includes("food")) {
    data.category = "Meals";
  } else if (lowerText.includes("fuel") || lowerText.includes("petrol") || lowerText.includes("gas")) {
    data.category = "Travel";
  } else if (lowerText.includes("hotel") || lowerText.includes("lodging")) {
    data.category = "Travel";
  } else if (lowerText.includes("office") || lowerText.includes("stationery")) {
    data.category = "Office Supplies";
  }

  return data;
}

/**
 * POST /api/receipts/extract - Extract data from receipt image
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files supported" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract data
    const extractedData = await extractFromImage(buffer);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("Receipt extraction error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract receipt data",
      },
      { status: 500 }
    );
  }
}
