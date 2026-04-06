import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { listTransactions } from "@/server/transactions/list";
import { db, accounts } from "@/lib/db";
import { eq } from "drizzle-orm";
import { TransactionsClient } from "./transactions-client";
import { auth } from "@clerk/nextjs/server";

export default async function TransactionsPage() {
  const { userId } = await auth();
  const organizationId = await getCurrentOrganizationId();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Fetch initial data on the server
  const [transactionsResponse, accountsList] = await Promise.all([
    listTransactions({ organizationId, limit: 50 }),
    db.select().from(accounts).where(eq(accounts.organizationId, organizationId)),
  ]);

  const transactions = transactionsResponse.success ? transactionsResponse.data?.data || [] : [];
  
  // Map server transactions to client-side Transaction interface
  const mappedTransactions = transactions.map((t: any) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    journalEntry: t.journalType || "General",
    lines: t.lines.map((l: any) => ({
      account: l.accountName,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    })),
    totalDebit: t.totalDebit,
    totalCredit: t.totalCredit,
    status: t.isPosted ? "posted" : "draft",
    createdBy: t.createdBy || "System",
    createdAt: t.createdAt.toISOString(),
  }));

  const mappedAccounts = accountsList.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    code: a.code,
  }));

  return (
    <Suspense fallback={<div>Loading transactions...</div>}>
      <TransactionsClient 
        initialTransactions={mappedTransactions} 
        accounts={mappedAccounts}
        organizationId={organizationId}
        userId={userId}
      />
    </Suspense>
  );
}
