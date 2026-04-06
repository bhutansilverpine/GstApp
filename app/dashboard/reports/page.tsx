import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { 
  generateTrialBalance, 
  generateIncomeStatement, 
  generateBalanceSheet, 
  generateGSTReport,
  generateCashFlowStatement
} from "@/server/transactions/reports";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const organizationId = await getCurrentOrganizationId();

  // Fetch initial data for the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    trialBalance,
    incomeStatement,
    balanceSheet,
    gstReport,
    cashFlow
  ] = await Promise.all([
    generateTrialBalance(organizationId, now),
    generateIncomeStatement(organizationId, { from: startOfMonth, to: endOfMonth }),
    generateBalanceSheet(organizationId, now),
    generateGSTReport(organizationId, { from: startOfMonth, to: endOfMonth }),
    generateCashFlowStatement(organizationId, { from: startOfMonth, to: endOfMonth }),
  ]);

  return (
    <Suspense fallback={<div>Loading financial reports...</div>}>
      <ReportsClient 
        initialData={{
          trialBalance: trialBalance.success ? trialBalance.data : null,
          incomeStatement: incomeStatement.success ? incomeStatement.data : null,
          balanceSheet: balanceSheet.success ? balanceSheet.data : null,
          gstReport: gstReport.success ? gstReport.data : null,
          cashFlow: cashFlow.success ? cashFlow.data : null,
        }}
        organizationId={organizationId}
      />
    </Suspense>
  );
}
