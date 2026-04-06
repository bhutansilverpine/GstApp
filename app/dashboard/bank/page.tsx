import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { listBankTransactions, getBankTransactionsSummary } from "@/server/bank/list";
import { BankClient } from "./bank-client";

export default async function BankPage() {
  const organizationId = await getCurrentOrganizationId();

  // Fetch initial data on the server
  const [bankResponse, summaryResponse] = await Promise.all([
    listBankTransactions({ organizationId, limit: 50 }),
    getBankTransactionsSummary(organizationId),
  ]);

  const transactionsRaw = bankResponse.success ? bankResponse.data?.transactions || [] : [];
  const summary = summaryResponse.success ? summaryResponse.data : null;

  // Map to the component's expected format
  const mappedTransactions = transactionsRaw.map((t: any) => ({
    id: t.id,
    date: t.date ? t.date.toISOString().split("T")[0] : "",
    description: t.description,
    amount: Number(t.amount || 0),
    type: Number(t.amount || 0) < 0 ? "debit" : "credit",
    balance: Number(t.balance || 0),
    category: t.categoryId || "", // In a real app we'd join for the name
    status: t.status as any,
    reference: t.reference || "",
  }));

  return (
    <Suspense fallback={<div>Loading bank transactions...</div>}>
      <BankClient 
        initialTransactions={mappedTransactions} 
        initialSummary={summary}
        organizationId={organizationId}
      />
    </Suspense>
  );
}
