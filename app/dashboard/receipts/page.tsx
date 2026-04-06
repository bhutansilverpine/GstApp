import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { listReceipts, getReceiptsSummary } from "@/server/receipts/list";
import { ReceiptsClient } from "./receipts-client";

export default async function ReceiptsPage() {
  const organizationId = await getCurrentOrganizationId();

  // Fetch initial data on the server
  const [receiptsResponse, summaryResponse] = await Promise.all([
    listReceipts({ organizationId, limit: 50 }),
    getReceiptsSummary(organizationId),
  ]);

  const allReceiptsRaw = receiptsResponse.success ? receiptsResponse.data?.data || [] : [];
  const summary = summaryResponse.success ? summaryResponse.data : null;

  // Map to the component's expected format
  const unverifiedReceipts = allReceiptsRaw
    .filter((r: any) => r.status === "pending")
    .map((r: any) => ({
      id: r.id,
      fileName: r.vendorName || "receipt.pdf",
      uploadedAt: r.createdAt.toISOString(),
      fields: {
        amount: { value: Number(r.totalAmount || 0), confidence: 100, isEditable: true },
        date: { value: r.date ? r.date.toISOString().split("T")[0] : "", confidence: 100, isEditable: true },
        vendor: { value: r.vendorName || "", confidence: 100, isEditable: true },
        tpn: {
          value: r.vendorTpn || "",
          confidence: 100,
          isEditable: true,
          hasTPN: !!r.vendorTpn,
        },
        gstin: {
          value: r.vendorGstNumber || "",
          confidence: 100,
          isEditable: true,
        },
        gstAmount: { value: Number(r.gstAmount || 0), confidence: 100, isEditable: true },
      },
      status: "pending" as const,
    }));

  const verifiedReceipts = allReceiptsRaw
    .filter((r: any) => r.status === "verified")
    .map((r: any) => ({
      id: r.id,
      fileName: r.vendorName || "receipt.pdf",
      amount: Number(r.totalAmount || 0),
      date: r.date ? r.date.toISOString().split("T")[0] : "",
      vendor: r.vendorName || "",
      hasTPN: !!r.vendorTpn,
      gstAmount: Number(r.gstAmount || 0),
      category: r.category || "General",
      status: "verified" as const,
    }));

  const gstSummaryData = summary ? {
    totalGST: summary.totalGSTClaimable,
    claimableGST: summary.totalGSTClaimable,
    nonClaimableGST: 0, // Need more logic if we want to separate these
    totalReceipts: summary.totalReceipts,
    receiptsWithTPN: summary.verifiedReceipts, // Approximate for now
    receiptsWithoutTPN: summary.pendingReceipts,
    averageConfidence: 100,
    monthlyComparison: {
      currentMonth: summary.totalGSTClaimable,
      previousMonth: 0,
      percentageChange: 0,
    },
    breakdown: summary.categoryBreakdown.map((c: any) => ({
      category: c.category,
      amount: c.amount,
      percentage: (c.amount / (summary.totalAmount || 1)) * 100,
      claimable: true,
    })),
  } : {
    totalGST: 0,
    claimableGST: 0,
    nonClaimableGST: 0,
    totalReceipts: 0,
    receiptsWithTPN: 0,
    receiptsWithoutTPN: 0,
    averageConfidence: 0,
    monthlyComparison: { currentMonth: 0, previousMonth: 0, percentageChange: 0 },
    breakdown: [],
  };

  return (
    <Suspense fallback={<div>Loading receipts...</div>}>
      <ReceiptsClient 
        initialUnverified={unverifiedReceipts} 
        initialVerified={verifiedReceipts}
        initialGSTSummary={gstSummaryData}
        organizationId={organizationId}
      />
    </Suspense>
  );
}
