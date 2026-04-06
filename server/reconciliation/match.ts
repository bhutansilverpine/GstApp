"use server";

import { db, bankTransactions, receipts } from "@/lib/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface ReconciliationMatch {
  bankTransactionId: string;
  receiptId: string;
  confidence: number;
  reasons: string[];
}

interface MatchResult {
  matches: ReconciliationMatch[];
  unmatchedReceipts: any[];
  unmatchedBankTransactions: any[];
}

/**
 * Find intelligent matches between bank transactions and receipts
 * Uses multiple criteria with confidence scoring
 */
export async function findMatches(
  organizationId: string,
  options: {
    dateToleranceDays?: number;
    amountTolerance?: number;
    requireVendorMatch?: boolean;
  } = {}
): Promise<ApiResponse<MatchResult>> {
  try {
    const {
      dateToleranceDays = 3,
      amountTolerance = 0.5, // 50 cents tolerance
      requireVendorMatch = false,
    } = options;

    // Get unreconciled bank transactions
    const unreconciledBank = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          eq(bankTransactions.status, "unreconciled")
        )
      )
      .orderBy(bankTransactions.date);

    // Get verified receipts that aren't reconciled
    const unreconciledReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.organizationId, organizationId),
          eq(receipts.status, "verified"),
          sql`${receipts.id} NOT IN (SELECT receipt_id FROM bank_transactions WHERE receipt_id IS NOT NULL)`
        )
      )
      .orderBy(receipts.date);

    console.log(
      `Found ${unreconciledBank.length} bank transactions and ${unreconciledReceipts.length} receipts to match`
    );

    const matches: ReconciliationMatch[] = [];
    const matchedReceiptIds = new Set<string>();
    const matchedBankIds = new Set<string>();

    // Find potential matches
    for (const bankTx of unreconciledBank) {
      const bankAmount = Math.abs(Number(bankTx.amount) || 0);
      const bankDate = new Date(bankTx.date!);
      const bankDesc = (bankTx.description || "").toLowerCase();

      for (const receipt of unreconciledReceipts) {
        // Skip if already matched
        if (matchedReceiptIds.has(receipt.id) || matchedBankIds.has(bankTx.id)) {
          continue;
        }

        const receiptAmount = Number(receipt.totalAmount || 0);
        const receiptDate = new Date(receipt.date!);
        const receiptVendor = (receipt.vendorName || "").toLowerCase();
        const receiptDesc = (receipt.description || "").toLowerCase();

        // Calculate confidence score and reasons
        const confidence: { score: number; reasons: string[] } = {
          score: 0,
          reasons: [],
        };

        // 1. Amount match (highest weight: 0-40 points)
        const amountDiff = Math.abs(bankAmount - receiptAmount);
        if (amountDiff <= amountTolerance) {
          const amountScore = 40 * (1 - amountDiff / (amountTolerance || 1));
          confidence.score += amountScore;
          confidence.reasons.push(
            `Amount match: ${bankAmount.toFixed(2)} vs ${receiptAmount.toFixed(2)}`
          );
        } else if (amountDiff <= receiptAmount * 0.01) {
          // Within 1%
          confidence.score += 30;
          confidence.reasons.push(
            `Amount within 1%: ${bankAmount.toFixed(2)} vs ${receiptAmount.toFixed(2)}`
          );
        }

        // 2. Date proximity (0-30 points)
        const daysDiff = Math.abs(
          (bankDate.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= dateToleranceDays) {
          const dateScore = 30 * (1 - daysDiff / (dateToleranceDays || 1));
          confidence.score += dateScore;
          confidence.reasons.push(
            `Date within ${dateToleranceDays} days: ${daysDiff.toFixed(0)} days apart`
          );
        }

        // 3. Vendor name similarity (0-20 points)
        if (receiptVendor && bankDesc) {
          const similarity = calculateStringSimilarity(receiptVendor, bankDesc);
          if (similarity > 0.6) {
            const vendorScore = 20 * similarity;
            confidence.score += vendorScore;
            confidence.reasons.push(
              `Vendor name similarity: ${(similarity * 100).toFixed(0)}%`
            );
          }
        }

        // 4. Category/description keywords (0-10 points)
        const categoryKeywords = extractKeywords(receiptDesc);
        const bankKeywords = extractKeywords(bankDesc);
        const keywordMatches = categoryKeywords.filter((kw) =>
          bankKeywords.includes(kw)
        ).length;

        if (keywordMatches > 0) {
          confidence.score += Math.min(keywordMatches * 5, 10);
          confidence.reasons.push(
            `Matching keywords: ${keywordMatches} found`
          );
        }

        // 5. TPN/GST number presence (0-10 points)
        if (receipt.vendorTpn) {
          confidence.score += 5;
          confidence.reasons.push("Receipt has TPN (tax ID)");
        }

        // Apply vendor match requirement if specified
        if (requireVendorMatch && confidence.reasons.length === 0) {
          confidence.score = 0;
        }

        // Only add as match if confidence is above threshold
        if (confidence.score >= 40) {
          matches.push({
            bankTransactionId: bankTx.id,
            receiptId: receipt.id,
            confidence: Math.min(confidence.score, 100),
            reasons: confidence.reasons,
          });

          matchedReceiptIds.add(receipt.id);
          matchedBankIds.add(bankTx.id);
        }
      }
    }

    // Sort matches by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);

    // Get unmatched items
    const unmatchedReceipts = unreconciledReceipts.filter(
      (r) => !matchedReceiptIds.has(r.id)
    );
    const unmatchedBankTransactions = unreconciledBank.filter(
      (b) => !matchedBankIds.has(b.id)
    );

    console.log(
      `Found ${matches.length} potential matches, ${unmatchedReceipts.length} unmatched receipts, ${unmatchedBankTransactions.length} unmatched bank transactions`
    );

    return {
      success: true,
      data: {
        matches,
        unmatchedReceipts,
        unmatchedBankTransactions,
      },
    };
  } catch (error) {
    console.error("Find matches error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to find matches",
    };
  }
}

/**
 * Calculate string similarity using Jaccard similarity
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "being",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return words;
}

/**
 * Find matches for a specific bank transaction
 */
export async function findMatchesForBankTransaction(
  bankTransactionId: string,
  organizationId: string
): Promise<ApiResponse<ReconciliationMatch[]>> {
  try {
    // Get the bank transaction
    const [bankTx] = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, bankTransactionId),
          eq(bankTransactions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!bankTx) {
      return {
        success: false,
        error: "Bank transaction not found",
      };
    }

    // Get potential matching receipts
    const bankAmount = Math.abs(Number(bankTx.amount) || 0);
    const bankDate = new Date(bankTx.date!);

    // Find receipts within date range and amount range
    const dateFrom = new Date(bankDate);
    dateFrom.setDate(dateFrom.getDate() - 3);
    const dateTo = new Date(bankDate);
    dateTo.setDate(dateTo.getDate() + 3);

    const potentialReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.organizationId, organizationId),
          eq(receipts.status, "verified"),
          gte(receipts.date, dateFrom),
          lte(receipts.date, dateTo),
          sql`${receipts.id} NOT IN (SELECT receipt_id FROM bank_transactions WHERE receipt_id IS NOT NULL)`
        )
      );

    const matches: ReconciliationMatch[] = [];

    for (const receipt of potentialReceipts) {
      const receiptAmount = Number(receipt.totalAmount || 0);
      const receiptDate = new Date(receipt.date!);

      // Calculate confidence
      const confidence: { score: number; reasons: string[] } = {
        score: 0,
        reasons: [],
      };

      // Amount match
      const amountDiff = Math.abs(bankAmount - receiptAmount);
      if (amountDiff <= 0.5) {
        confidence.score += 40 * (1 - amountDiff / 0.5);
        confidence.reasons.push(
          `Amount match: ${bankAmount.toFixed(2)} vs ${receiptAmount.toFixed(2)}`
        );
      }

      // Date proximity
      const daysDiff = Math.abs(
        (bankDate.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 3) {
        confidence.score += 30 * (1 - daysDiff / 3);
        confidence.reasons.push(
          `Date within 3 days: ${daysDiff.toFixed(0)} days apart`
        );
      }

      // Only include if confidence is above threshold
      if (confidence.score >= 30) {
        matches.push({
          bankTransactionId: bankTx.id,
          receiptId: receipt.id,
          confidence: Math.min(confidence.score, 100),
          reasons: confidence.reasons,
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: matches,
    };
  } catch (error) {
    console.error("Find matches for bank transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to find matches",
    };
  }
}

/**
 * Find matches for a specific receipt
 */
export async function findMatchesForReceipt(
  receiptId: string,
  organizationId: string
): Promise<ApiResponse<ReconciliationMatch[]>> {
  try {
    // Get the receipt
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!receipt) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    // Get potential matching bank transactions
    const receiptAmount = Number(receipt.totalAmount || 0);
    const receiptDate = new Date(receipt.date!);

    // Find bank transactions within date range and amount range
    const dateFrom = new Date(receiptDate);
    dateFrom.setDate(dateFrom.getDate() - 3);
    const dateTo = new Date(receiptDate);
    dateTo.setDate(dateTo.getDate() + 3);

    const potentialBankTx = await db
      .select()
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, organizationId),
          eq(bankTransactions.status, "unreconciled"),
          gte(bankTransactions.date, dateFrom),
          lte(bankTransactions.date, dateTo)
        )
      );

    const matches: ReconciliationMatch[] = [];

    for (const bankTx of potentialBankTx) {
      const bankAmount = Math.abs(Number(bankTx.amount) || 0);
      const bankDate = new Date(bankTx.date!);

      // Calculate confidence
      const confidence: { score: number; reasons: string[] } = {
        score: 0,
        reasons: [],
      };

      // Amount match
      const amountDiff = Math.abs(bankAmount - receiptAmount);
      if (amountDiff <= 0.5) {
        confidence.score += 40 * (1 - amountDiff / 0.5);
        confidence.reasons.push(
          `Amount match: ${bankAmount.toFixed(2)} vs ${receiptAmount.toFixed(2)}`
        );
      }

      // Date proximity
      const daysDiff = Math.abs(
        (bankDate.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 3) {
        confidence.score += 30 * (1 - daysDiff / 3);
        confidence.reasons.push(
          `Date within 3 days: ${daysDiff.toFixed(0)} days apart`
        );
      }

      // Vendor name similarity
      const receiptVendor = (receipt.vendorName || "").toLowerCase();
      const bankDesc = (bankTx.description || "").toLowerCase();
      const similarity = calculateStringSimilarity(receiptVendor, bankDesc);

      if (similarity > 0.5) {
        confidence.score += 20 * similarity;
        confidence.reasons.push(
          `Vendor name similarity: ${(similarity * 100).toFixed(0)}%`
        );
      }

      // Only include if confidence is above threshold
      if (confidence.score >= 30) {
        matches.push({
          bankTransactionId: bankTx.id,
          receiptId: receipt.id,
          confidence: Math.min(confidence.score, 100),
          reasons: confidence.reasons,
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: matches,
    };
  } catch (error) {
    console.error("Find matches for receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to find matches",
    };
  }
}

/**
 * Auto-match high-confidence suggestions
 */
export async function autoMatch(
  organizationId: string,
  confidenceThreshold = 80
): Promise<ApiResponse<{ matched: number; skipped: number }>> {
  try {
    // Find all matches
    const result = await findMatches(organizationId);

    if (!result.success) {
      return {
        success: false,
        error: "Failed to find matches",
      };
    }

    // Filter high-confidence matches
    const highConfidenceMatches = result.data!.matches.filter(
      (m) => m.confidence >= confidenceThreshold
    );

    let matched = 0;
    let skipped = 0;

    // Auto-confirm high-confidence matches
    for (const match of highConfidenceMatches) {
      const confirmResult = await confirmMatch(
        match.bankTransactionId,
        match.receiptId,
        organizationId,
        `Auto-matched with ${match.confidence.toFixed(0)}% confidence`
      );

      if (confirmResult.success) {
        matched++;
      } else {
        skipped++;
      }
    }

    console.log(
      `Auto-matched ${matched} transactions, skipped ${skipped} at ${confidenceThreshold}% confidence threshold`
    );

    return {
      success: true,
      data: { matched, skipped },
    };
  } catch (error) {
    console.error("Auto-match error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to auto-match",
    };
  }
}
