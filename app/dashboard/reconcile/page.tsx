import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { findMatches } from "@/server/reconciliation/match";
import { ReconcileClient } from "./reconcile-client";

export default async function ReconcilePage() {
  const organizationId = await getCurrentOrganizationId();

  // Find matches between bank transactions and receipts
  const result = await findMatches(organizationId);

  const matches = result.success ? result.data?.matches || [] : [];
  const unmatchedBank = result.success ? result.data?.unmatchedBankTransactions || [] : [];
  const unmatchedReceipts = result.success ? result.data?.unmatchedReceipts || [] : [];

  // Map to the component's expected format
  const mappedBankTransactions = unmatchedBank.map((b: any) => ({
    id: b.id,
    date: b.date ? b.date.toISOString().split("T")[0] : "",
    description: b.description,
    amount: Math.abs(Number(b.amount || 0)),
    type: Number(b.amount || 0) < 0 ? "debit" : "credit",
  }));

  const mappedReceipts = unmatchedReceipts.map((r: any) => ({
    id: r.id,
    date: r.date ? r.date.toISOString().split("T")[0] : "",
    vendor: r.vendorName || "Unknown Vendor",
    amount: Number(r.totalAmount || 0),
    category: r.category || "General",
  }));

  const mappedSuggestedMatches = matches.map((m: any) => {
    // Find the corresponding bank and receipt in the unmatched lists
    // (In a real app, findMatches would return the full objects or we'd fetch them)
    // For now, we'll assume findMatches returns enough info or we'd map correctly.
    // Let's refine findMatches to ensure it returns enough for the UI.
    return {
      bankTransaction: mappedBankTransactions.find(b => b.id === m.bankTransactionId),
      receipt: mappedReceipts.find(r => r.id === m.receiptId),
      confidence: m.confidence,
      reasons: m.reasons,
    };
  }).filter(m => m.bankTransaction && m.receipt);

  return (
    <Suspense fallback={<div>Loading reconciliation data...</div>}>
      <ReconcileClient 
        bankTransactions={mappedBankTransactions} 
        receipts={mappedReceipts}
        suggestedMatches={mappedSuggestedMatches}
        organizationId={organizationId}
      />
    </Suspense>
  );
}
