import { MetricCard } from "@/components/dashboard/metric-card"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { WorkflowChecklist } from "@/components/dashboard/workflow-checklist"
import { PremiumCard, PremiumButton } from "@/components/ui"
import {
  CircleDollarSign,
  FileText,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  CircleDollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCurrentOrganizationId } from "@/server"
import { db, organizations } from "@/lib/db"
import { eq } from "drizzle-orm"
import { getOrganizationStats, getRecentTransactions } from "@/lib/db/queries"
import { getReceiptsSummary } from "@/server/receipts/list"
import { getBankTransactionsSummary } from "@/server/bank/list"
import Link from "next/link"

export default async function DashboardPage() {
  const organizationId = await getCurrentOrganizationId()

  // Fetch all dashboard data
  const [
    org,
    stats,
    recentTransactions,
    receiptsSummary,
    bankSummary
  ] = await Promise.all([
    db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) }),
    getOrganizationStats(organizationId),
    getRecentTransactions(organizationId, 5),
    getReceiptsSummary(organizationId),
    getBankTransactionsSummary(organizationId),
  ])

  const totalInflow = bankSummary.success ? bankSummary.data?.totalCredits || 0 : 0
  const totalOutflow = bankSummary.success ? Math.abs(bankSummary.data?.totalDebits || 0) : 0
  const gstClaimable = receiptsSummary.success ? receiptsSummary.data?.totalGSTClaimable || 0 : 0
  const pendingReceiptsCount = stats.pendingReceipts

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to {org?.name || "your workspace"}. Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cash Inflow"
          value={`Nu. ${totalInflow.toLocaleString()}`}
          change={0}
          changeType="increase"
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
          description="Net credits this month"
        />
        <MetricCard
          title="Total Cash Outflow"
          value={`₹${totalOutflow.toLocaleString()}`}
          change={0}
          changeType="decrease"
          trend="down"
          icon={<ArrowDownRight className="h-4 w-4" />}
          description="Net debits this month"
        />
        <MetricCard
          title="GST Claimable"
          value={`₹${gstClaimable.toLocaleString()}`}
          change={0}
          changeType="increase"
          trend="up"
          icon={<TrendingUp className="h-4 w-4" />}
          description="From verified receipts"
        />
        <MetricCard
          title="Pending Review"
          value={pendingReceiptsCount.toString()}
          change={0}
          changeType="neutral"
          trend="neutral"
          icon={<Clock className="h-4 w-4" />}
          description="Receipts awaiting verification"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Transactions */}
        <GlassCard
          title="Recent Activity"
          description="Your latest journal entries and transactions"
          className="lg:col-span-4"
        >
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No recent activity found.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground text-uppercase">
                      {tx.journalType} • {tx.date.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-500 flex items-center justify-end gap-1">
                      {tx.isPosted ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Posted
                        </>
                      ) : (
                        "Draft"
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Button variant="ghost" className="w-full text-xs" asChild>
              <Link href="/dashboard/transactions">View All Transactions</Link>
            </Button>
          </div>
        </GlassCard>

        {/* Quick Actions & Workflow Checklist */}
        <div className="lg:col-span-3 space-y-6">
          <WorkflowChecklist />

          <GlassCard title="Quick Actions">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/receipts">
                  <Upload className="h-4 w-4" />
                  Upload New Receipt
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/reconcile">
                  <RefreshCw className="h-4 w-4" />
                  Match Transactions
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/bit">
                  <Download className="h-4 w-4" />
                  Export BIT Excel
                </Link>
              </Button>
            </div>
          </GlassCard>

          <GlassCard title="Compliance Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">GST Registration</p>
                  <p className="text-xs text-muted-foreground">
                    {org?.gstRegistered ? "Registered" : "Not Registered"}
                  </p>
                </div>
                <div className={`h-2 w-2 rounded-full ${org?.gstRegistered ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Organization TPN</p>
                  <p className="text-xs text-muted-foreground">{org?.tpn || "Missing TPN"}</p>
                </div>
                <div className={`h-2 w-2 rounded-full ${org?.tpn ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function Upload({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
