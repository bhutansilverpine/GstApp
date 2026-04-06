"use server";

import { revalidatePath } from "next/cache";
import { db, bankTransactions, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import pdfParse from "pdf-parse";
import type {
  CreateBankTransactionInput,
  BankTransactionRawData,
  ApiResponse,
} from "@/types";

// Types for parsed bank transaction
interface ParsedBankTransaction {
  date: string;
  description: string;
  reference: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  category: string;
  accountNumber: string;
  paymentMode: string;
  merchant: string;
}

interface ProcessBankStatementResult {
  success: boolean;
  transactions?: CreateBankTransactionInput[];
  error?: string;
  summary?: {
    totalTransactions: number;
    totalWithdrawals: number;
    totalDeposits: number;
    openingBalance: number;
    closingBalance: number;
  };
}

/**
 * Process bank statement PDF (BOB or BNB format)
 * Parses PDF, extracts transactions, and creates database records
 */
export async function processBankStatement(
  formData: FormData,
  organizationId: string
): Promise<ProcessBankStatementResult> {
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

    // Get PDF file and optional password from form data
    const file = formData.get("file") as File;
    const password = formData.get("password") as string | null;

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

    // Validate file size (max 15MB for bank statements)
    if (file.size > 15 * 1024 * 1024) {
      return {
        success: false,
        error: "File size exceeds 15MB limit",
      };
    }

    console.log(`Processing bank statement: ${file.name} (${file.size} bytes)`);

    // Read PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF (handle password-protected files)
    let data: any;
    try {
      if (password) {
        // For password-protected PDFs, we need to use pdf-lib or similar
        // pdf-parse doesn't directly support passwords, so we'll try without first
        data = await pdfParse(buffer);
      } else {
        data = await pdfParse(buffer);
      }
    } catch (error: any) {
      if (error.message && error.message.includes("password")) {
        return {
          success: false,
          error: "PDF is password-protected. Please provide the password.",
        };
      }
      throw error;
    }

    console.log(`PDF parsed: ${data.numpages} pages, ${data.text.length} characters`);

    // Extract text content
    const text = data.text;

    // Determine bank format (BOB or BNB) and parse accordingly
    const isBOB = text.includes("Bank of Bhutan") || text.includes("BOB");
    const isBNB = text.includes("Bhutan National Bank") || text.includes("BNB");

    let transactions: ParsedBankTransaction[] = [];

    if (isBNB) {
      transactions = parseBNBStatement(text);
    } else if (isBOB) {
      transactions = parseBOBStatement(text);
    } else {
      // Try to auto-detect format
      transactions = parseAutoDetect(text);
    }

    console.log(`Extracted ${transactions.length} transactions`);

    if (transactions.length === 0) {
      return {
        success: false,
        error: "No transactions could be extracted from the statement",
      };
    }

    // Convert to database format
    const transactionInputs: CreateBankTransactionInput[] = [];
    let totalWithdrawals = 0;
    let totalDeposits = 0;

    for (const parsed of transactions) {
      const withdrawal = parsed.withdrawal || 0;
      const deposit = parsed.deposit || 0;
      const amount = withdrawal > 0 ? -withdrawal : deposit;

      totalWithdrawals += withdrawal;
      totalDeposits += deposit;

      // Prepare raw data metadata
      const rawData: BankTransactionRawData = {
        bankReference: parsed.reference,
        code: parsed.paymentMode,
        particulars: parsed.description,
      };

      const transactionInput: CreateBankTransactionInput = {
        organizationId: organizationId,
        date: parseDate(parsed.date),
        description: parsed.merchant || parsed.description,
        reference: parsed.reference || undefined,
        amount: String(amount),
        balance: String(parsed.balance),
        transactionType: withdrawal > 0 ? "debit" : "credit",
        status: "unreconciled",
        categoryId: undefined, // Will be auto-categorized
        notes: `Auto-categorized as: ${parsed.category}`,
        rawData: rawData,
      };

      transactionInputs.push(transactionInput);
    }

    // Insert transactions into database
    const insertedTransactions = await db
      .insert(bankTransactions)
      .values(transactionInputs)
      .returning();

    console.log(`Created ${insertedTransactions.length} bank transaction records`);

    // Calculate summary
    const openingBalance = transactions.length > 0 ? transactions[0].balance : 0;
    const closingBalance =
      transactions.length > 0
        ? transactions[transactions.length - 1].balance
        : 0;

    // Revalidate cache
    revalidatePath(`/dashboard/${organizationId}/bank`);
    revalidatePath(`/dashboard/${organizationId}/reconciliation`);

    return {
      success: true,
      transactions: transactionInputs,
      summary: {
        totalTransactions: transactions.length,
        totalWithdrawals,
        totalDeposits,
        openingBalance,
        closingBalance,
      },
    };
  } catch (error) {
    console.error("Bank statement processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process bank statement",
    };
  }
}

/**
 * Parse BNB (Bhutan National Bank) statement format
 * Handles multi-line transactions with specific column layout
 */
function parseBNBStatement(text: string): ParsedBankTransaction[] {
  const lines = text.split("\n");
  const transactions: ParsedBankTransaction[] = [];
  let currentTransaction: Partial<ParsedBankTransaction> | null = null;

  // Regex patterns for BNB format
  const dateRegex = /^\d{1,2}-[A-Za-z]{3}-\d{2,4}/;
  const amountRegex = /[\d,]+\.?\d*/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.includes("Date") || trimmedLine.includes("Particulars")) {
      continue;
    }

    // Check if this line starts a new transaction (has date)
    const dateMatch = trimmedLine.match(dateRegex);

    if (dateMatch) {
      // Save previous transaction if exists
      if (currentTransaction && currentTransaction.description) {
        const parsed = parseTransactionLine(currentTransaction);
        if (parsed) {
          transactions.push(parsed);
        }
      }

      // Start new transaction
      currentTransaction = {
        date: dateMatch[0],
        description: "",
        reference: "",
        withdrawal: 0,
        deposit: 0,
        balance: 0,
        category: "MISC/PERSONAL",
        accountNumber: "",
        paymentMode: "OTHER",
        merchant: "",
      };

      // Parse the rest of the line
      const remainingText = trimmedLine.substring(dateMatch[0].length).trim();
      parseBNBLineParts(remainingText, currentTransaction);
    } else if (currentTransaction) {
      // This is a continuation line, append to description
      currentTransaction.description += " " + trimmedLine;
    }
  }

  // Don't forget the last transaction
  if (currentTransaction && currentTransaction.description) {
    const parsed = parseTransactionLine(currentTransaction);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions;
}

/**
 * Parse BOB (Bank of Bhutan) statement format
 */
function parseBOBStatement(text: string): ParsedBankTransaction[] {
  const lines = text.split("\n");
  const transactions: ParsedBankTransaction[] = [];

  // BOB format is similar to BNB but may have different column order
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.includes("Date") || trimmedLine.includes("Description")) {
      continue;
    }

    const dateMatch = trimmedLine.match(dateRegex);
    if (dateMatch) {
      const transaction = parseBOBLine(trimmedLine);
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }

  return transactions;
}

/**
 * Auto-detect and parse bank statement format
 */
function parseAutoDetect(text: string): ParsedBankTransaction[] {
  // Try BNB format first (more common)
  try {
    const transactions = parseBNBStatement(text);
    if (transactions.length > 0) {
      return transactions;
    }
  } catch (error) {
    console.log("BNB parsing failed, trying BOB format");
  }

  // Fallback to BOB format
  return parseBOBStatement(text);
}

/**
 * Parse BNB line parts into transaction fields
 */
function parseBNBLineParts(
  line: string,
  transaction: Partial<ParsedBankTransaction>
): void {
  // Extract amounts (withdrawal, deposit, balance)
  const amountMatches = line.match(/([\d,]+\.?\d*)/g);

  if (amountMatches && amountMatches.length >= 2) {
    // Last amount is always balance
    transaction.balance = parseFloat(amountMatches[amountMatches.length - 1].replace(/,/g, ""));

    // Second to last is either withdrawal or deposit
    if (amountMatches.length >= 3) {
      const withdrawal = parseFloat(amountMatches[amountMatches.length - 2].replace(/,/g, ""));
      const deposit = parseFloat(amountMatches[amountMatches.length - 3].replace(/,/g, ""));

      if (withdrawal > 0) {
        transaction.withdrawal = withdrawal;
        transaction.deposit = 0;
      } else if (deposit > 0) {
        transaction.deposit = deposit;
        transaction.withdrawal = 0;
      }
    }

    // Remove amounts from line to get description
    let remainingText = line;
    amountMatches.forEach(match => {
      remainingText = remainingText.replace(match, "");
    });

    // Clean up remaining text
    transaction.description = remainingText
      .replace(/\s+/g, " ")
      .replace(/[\|,\-]/g, " ")
      .trim();

    // Parse transaction details
    parseTransactionDetails(transaction);
  }
}

/**
 * Parse BOB line into transaction
 */
function parseBOBLine(line: string): ParsedBankTransaction | null {
  try {
    const parts = line.split(/\s{2,}|\t/); // Split by 2+ spaces or tabs

    if (parts.length < 4) return null;

    const date = parts[0];
    const description = parts[1] || "";
    const withdrawal = parseFloat(parts[2]?.replace(/,/g, "") || "0");
    const deposit = parseFloat(parts[3]?.replace(/,/g, "") || "0");
    const balance = parseFloat(parts[4]?.replace(/,/g, "") || "0");

    const transaction: ParsedBankTransaction = {
      date,
      description,
      reference: "",
      withdrawal,
      deposit,
      balance,
      category: "MISC/PERSONAL",
      accountNumber: "",
      paymentMode: "OTHER",
      merchant: "",
    };

    parseTransactionDetails(transaction);

    return transaction;
  } catch (error) {
    console.error("Error parsing BOB line:", error);
    return null;
  }
}

/**
 * Parse transaction details (category, payment mode, merchant, etc.)
 */
function parseTransactionDetails(
  transaction: Partial<ParsedBankTransaction>
): void {
  if (!transaction.description) return;

  const description = transaction.description.toUpperCase();

  // Extract account/mobile number
  const accountMatch = description.match(/\d{8,12}/);
  transaction.accountNumber = accountMatch ? accountMatch[0] : "";

  // Identify payment mode
  const paymentModes: { [key: string]: string } = {
    GPAY: "GPAY",
    MBANK: "M-BOB",
    NQRC: "QR-PAY",
    UPI: "UPI",
    ATM: "CASH",
    POS: "CARD",
    INDO: "INDO-TRANS",
    "BT-POS": "CARD",
  };

  for (const [key, value] of Object.entries(paymentModes)) {
    if (description.includes(key)) {
      transaction.paymentMode = value;
      break;
    }
  }

  // Clean merchant name
  let merchant = description;
  const removalPatterns = [
    "OUTGOING PAYMENT VIA",
    "INCOMING PAYMENT VIA",
    "TRANSFER FROM",
    "TRANSFER TO",
    "BY",
    "FROM",
    "TO",
  ];

  removalPatterns.forEach((pattern) => {
    merchant = merchant.replace(new RegExp(pattern, "gi"), "");
  });

  // Remove account numbers
  merchant = merchant.replace(/\d{8,12}/g, "");

  // Clean up separators
  merchant = merchant
    .replace(/[|,\-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/RRN/g, "")
    .trim();

  transaction.merchant = merchant.substring(0, 40); // Limit length

  // Auto-categorize based on keywords
  transaction.category = categorizeTransaction(merchant);
}

/**
 * Categorize transaction based on keywords
 */
function categorizeTransaction(description: string): string {
  const upperDesc = description.toUpperCase();

  const categories: { [key: string]: string[] } = {
    FUEL: ["PETROL", "PUMP", "FUEL", "LUNGYEN", "DAMCHEN", "STATION"],
    FOOD: [
      "RESTAURANT",
      "CAFE",
      "HOTEL",
      "BAKERY",
      "ZOMATO",
      "KITCHEN",
      "SNACK",
      "TEA",
    ],
    SHOPPING: [
      "MALL",
      "MART",
      "STORE",
      "SHOP",
      "ENTERPRISE",
      "MARKET",
      "GROCERY",
      "SUPERMARKET",
    ],
    UTILITY: [
      "TASHI",
      "BTL",
      "RECHARGE",
      "BILL",
      "RICB",
      "POWER",
      "ELECTRIC",
      "WATER",
      "INTERNET",
    ],
    TRANSPORT: ["TAXI", "CAB", "BUS", "TRAVEL", "TRANSPORT"],
    HEALTH: ["PHARMACY", "HOSPITAL", "CLINIC", "MEDICAL", "DOCTOR"],
    OFFICE: ["OFFICE", "SUPPLY", "STATIONERY", "PRINT"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (upperDesc.includes(keyword)) {
        return category;
      }
    }
  }

  return "MISC/PERSONAL";
}

/**
 * Parse partial transaction into complete transaction
 */
function parseTransactionLine(
  partial: Partial<ParsedBankTransaction>
): ParsedBankTransaction | null {
  if (!partial.date || !partial.description) {
    return null;
  }

  return {
    date: partial.date,
    description: partial.description,
    reference: partial.reference || "",
    withdrawal: partial.withdrawal || 0,
    deposit: partial.deposit || 0,
    balance: partial.balance || 0,
    category: partial.category || "MISC/PERSONAL",
    accountNumber: partial.accountNumber || "",
    paymentMode: partial.paymentMode || "OTHER",
    merchant: partial.merchant || partial.description,
  };
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  try {
    // Handle DD-MMM-YY format (e.g., 15-Mar-25)
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const months: { [key: string]: string } = {
          Jan: "01",
          Feb: "02",
          Mar: "03",
          Apr: "04",
          May: "05",
          Jun: "06",
          Jul: "07",
          Aug: "08",
          Sep: "09",
          Oct: "10",
          Nov: "11",
          Dec: "12",
        };

        const day = parts[0].padStart(2, "0");
        const month = months[parts[1]] || "01";
        let year = parts[2];

        // Handle 2-digit years
        if (year.length === 2) {
          year = "20" + year;
        }

        return new Date(`${year}-${month}-${day}`);
      }
    }

    // Handle DD/MM/YY format (e.g., 15/03/25)
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        let year = parts[2];

        if (year.length === 2) {
          year = "20" + year;
        }

        return new Date(`${year}-${month}-${day}`);
      }
    }

    // Fallback: try to parse as-is
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // If all else fails, return current date
    console.warn(`Could not parse date: ${dateStr}, using current date`);
    return new Date();
  } catch (error) {
    console.error(`Error parsing date ${dateStr}:`, error);
    return new Date();
  }
}
