"use server";

import { db, receipts } from "@/lib/db";
import { eq, and, desc, like, or, gte, lte } from "drizzle-orm";
import type { ApiResponse, ReceiptFilters, PaginatedResponse } from "@/types";

interface ListReceiptsOptions {
  organizationId: string;
  filters?: ReceiptFilters;
  page?: number;
  limit?: number;
}

/**
 * List receipts with filtering and pagination
 */
export async function listReceipts({
  organizationId,
  filters,
  page = 1,
  limit = 20,
}: ListReceiptsOptions): Promise<ApiResponse<PaginatedResponse<any>>> {
  try {
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(receipts.organizationId, organizationId)];

    if (filters) {
      // Status filter
      if (filters.status) {
        conditions.push(eq(receipts.status, filters.status));
      }

      // Vendor TPN filter
      if (filters.vendorTpn) {
        conditions.push(eq(receipts.vendorTpn, filters.vendorTpn));
      }

      // Category filter
      if (filters.category) {
        conditions.push(eq(receipts.category, filters.category));
      }

      // Date range filter
      if (filters.dateRange) {
        conditions.push(gte(receipts.date, filters.dateRange.from));
        conditions.push(lte(receipts.date, filters.dateRange.to));
      }

      // Search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          or(
            like(receipts.vendorName, searchTerm),
            like(receipts.description, searchTerm),
            like(receipts.category, searchTerm)
          )!
        );
      }
    }

    // Get total count
    const totalCount = await db
      .select({ count: receipts.id })
      .from(receipts)
      .where(and(...conditions));

    // Get receipts with pagination
    const receiptList = await db
      .select()
      .from(receipts)
      .where(and(...conditions))
      .orderBy(desc(receipts.date))
      .limit(limit)
      .offset(offset);

    // Calculate totals
    const totalAmount = receiptList.reduce(
      (sum, r) => sum + Number(r.totalAmount || 0),
      0
    );
    const totalGST = receiptList.reduce(
      (sum, r) => sum + Number(r.gstAmount || 0),
      0
    );

    const totalPages = Math.ceil((totalCount.length || 0) / limit);

    return {
      success: true,
      data: receiptList,
      pagination: {
        page,
        limit,
        total: totalCount.length || 0,
        totalPages,
      },
    };
  } catch (error) {
    console.error("List receipts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list receipts",
    };
  }
}

/**
 * Get receipt by ID
 */
export async function getReceipt(
  receiptId: string,
  organizationId: string
): Promise<ApiResponse<any>> {
  try {
    const receiptList = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!receiptList.length) {
      return {
        success: false,
        error: "Receipt not found",
      };
    }

    return {
      success: true,
      data: receiptList[0],
    };
  } catch (error) {
    console.error("Get receipt error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get receipt",
    };
  }
}

/**
 * Get receipts summary for dashboard
 */
export async function getReceiptsSummary(
  organizationId: string,
  dateRange?: { from: Date; to: Date }
): Promise<ApiResponse<{
  totalReceipts: number;
  pendingReceipts: number;
  verifiedReceipts: number;
  totalAmount: number;
  totalGSTClaimable: number;
  categoryBreakdown: Array<{ category: string; count: number; amount: number }>;
}>> {
  try {
    const conditions = [eq(receipts.organizationId, organizationId)];

    if (dateRange) {
      conditions.push(gte(receipts.date, dateRange.from));
      conditions.push(lte(receipts.date, dateRange.to));
    }

    const allReceipts = await db
      .select()
      .from(receipts)
      .where(and(...conditions));

    const totalReceipts = allReceipts.length;
    const pendingReceipts = allReceipts.filter(r => r.status === "pending").length;
    const verifiedReceipts = allReceipts.filter(r => r.status === "verified").length;

    const totalAmount = allReceipts.reduce(
      (sum, r) => sum + Number(r.totalAmount || 0),
      0
    );
    const totalGSTClaimable = allReceipts.reduce(
      (sum, r) => sum + Number(r.gstAmount || 0),
      0
    );

    // Category breakdown
    const categoryMap = new Map<string, { count: number; amount: number }>();
    allReceipts.forEach((receipt) => {
      const category = receipt.category || "Uncategorized";
      const existing = categoryMap.get(category) || { count: 0, amount: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        amount: existing.amount + Number(receipt.totalAmount || 0),
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        amount: data.amount,
      })
    );

    return {
      success: true,
      data: {
        totalReceipts,
        pendingReceipts,
        verifiedReceipts,
        totalAmount,
        totalGSTClaimable,
        categoryBreakdown,
      },
    };
  } catch (error) {
    console.error("Get receipts summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get receipts summary",
    };
  }
}

/**
 * Get unique vendors from receipts
 */
export async function getUniqueVendors(
  organizationId: string
): Promise<ApiResponse<Array<{ name: string; tpn?: string }>>> {
  try {
    const receiptList = await db
      .select({
        vendorName: receipts.vendorName,
        vendorTpn: receipts.vendorTpn,
      })
      .from(receipts)
      .where(eq(receipts.organizationId, organizationId));

    // Remove duplicates
    const uniqueVendors = Array.from(
      new Map(
        receiptList
          .filter((r) => r.vendorName)
          .map((r) => [r.vendorName, r])
      ).values()
    );

    return {
      success: true,
      data: uniqueVendors,
    };
  } catch (error) {
    console.error("Get unique vendors error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unique vendors",
    };
  }
}

/**
 * Get pending receipts (awaiting verification)
 */
export async function getPendingReceipts(
  organizationId: string,
  limit = 50
): Promise<ApiResponse<any[]>> {
  try {
    const pendingReceipts = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.organizationId, organizationId),
          eq(receipts.status, "pending")
        )
      )
      .orderBy(desc(receipts.date))
      .limit(limit);

    return {
      success: true,
      data: pendingReceipts,
    };
  } catch (error) {
    console.error("Get pending receipts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get pending receipts",
    };
  }
}

/**
 * Get GST report data
 */
export async function getGSTReport(
  organizationId: string,
  dateRange: { from: Date; to: Date }
): Promise<ApiResponse<{
  totalPurchases: number;
  gstClaimable: number;
  gstNonClaimable: number;
  receiptsWithTPN: number;
  receiptsWithoutTPN: number;
  receiptsByCategory: Array<{ category: string; amount: number; gst: number }>;
}>> {
  try {
    const conditions = [
      eq(receipts.organizationId, organizationId),
      eq(receipts.status, "verified"),
      gte(receipts.date, dateRange.from),
      lte(receipts.date, dateRange.to),
    ];

    const verifiedReceipts = await db
      .select()
      .from(receipts)
      .where(and(...conditions));

    let totalPurchases = 0;
    let gstClaimable = 0;
    let gstNonClaimable = 0;
    let receiptsWithTPN = 0;
    let receiptsWithoutTPN = 0;

    const categoryMap = new Map<string, { amount: number; gst: number }>();

    verifiedReceipts.forEach((receipt) => {
      const amount = Number(receipt.totalAmount || 0);
      const gst = Number(receipt.gstAmount || 0);
      const category = receipt.category || "Uncategorized";
      const hasTPN = receipt.vendorTpn && receipt.vendorTpn.length > 0;

      totalPurchases += amount;

      if (hasTPN) {
        gstClaimable += gst;
        receiptsWithTPN++;
      } else {
        gstNonClaimable += gst;
        receiptsWithoutTPN++;
      }

      const existing = categoryMap.get(category) || { amount: 0, gst: 0 };
      categoryMap.set(category, {
        amount: existing.amount + amount,
        gst: existing.gst + gst,
      });
    });

    const receiptsByCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        amount: data.amount,
        gst: data.gst,
      })
    );

    return {
      success: true,
      data: {
        totalPurchases,
        gstClaimable,
        gstNonClaimable,
        receiptsWithTPN,
        receiptsWithoutTPN,
        receiptsByCategory,
      },
    };
  } catch (error) {
    console.error("Get GST report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get GST report",
    };
  }
}
