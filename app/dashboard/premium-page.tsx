import { MetricCard } from "@/components/dashboard/metric-card"
import { GlassCard } from "@/components/dashboard/glass-card"
import { PremiumCard, PremiumButton, PremiumDropdown, Button } from "@/components/ui"
import { PremiumGlassCard } from "@/components/dashboard/premium-glass-card"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { WorkflowChecklist } from "@/components/dashboard/workflow-checklist"
import {
  DollarSign,
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
  Upload,
  RefreshCw as RefreshCwIcon,
  Shield,
  Zap,
} from "lucide-react"
import { getCurrentOrganizationId } from "@/server"
import { db, organizations } from "@/lib/db"
import { eq } from "drizzle-orm"
import { getOrganizationStats, getRecentTransactions } from "@/lib/db/queries"
import { getReceiptsSummary } from "@/server/receipts/list"
import { getBankTransactionsSummary } from "@/server/bank/list"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in-up">
      {/* Header skeleton */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-800" />

      {/* Stats grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Skeleton />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    </div>
  )
}

export default async function PremiumDashboardPage() {
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
  ]).catch(() => ({
    org: null,
    stats: null,
    recentTransactions: [],
    receiptsSummary: null,
    bankSummary: null,
  }))

  if (!org && !organizationId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Organization Not Found</h1>
          <p className="text-muted-foreground">Please select or create an organization first.</p>
          <Button asChild>
            <Link href="/dashboard/settings">
              Go to Settings
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalInflow = bankSummary?.success ? bankSummary.data?.totalCredits || 0 : 0
  const totalOutflow = bankSummary?.success ? Math.abs(bankSummary.data?.totalDebits || 0) : 0
  const gstClaimable = receiptsSummary?.success ? receiptsSummary.data?.totalGSTClaimable || 0 : 0
  const pendingReceiptsCount = stats?.pendingReceipts || 0

  return (
    <div className="space-y-6 animate-in-up">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      {/* Header with premium components */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {org?.name || "Dashboard"}
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <PremiumButton
                variant="ghost"
                size="sm"
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Last 30 days
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </PremiumButton>
              <PremiumDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with premium cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in-up" style={{ animationDelay: "100ms" }}>
        <MetricCard
          title="Total Cash Inflow"
          valueNumber={totalInflow}
          value={`Nu. ${totalInflow.toLocaleString()}`}
          change={0}
          changeType="increase"
          trend="up"
          icon={<CircleDollarSign className="h-5 w-5" />}
          description="Net credits this month"
        />
        <MetricCard
          title="Total Cash Outflow"
          valueNumber={totalOutflow}
          value={`Nu. ${totalOutflow.toLocaleString()}`}
          change={0}
          changeType="decrease"
          trend="down"
          icon={<ArrowDownRight className="h-5 w-5" />}
          description="Net debits this month"
        />
        <MetricCard
          title="GST Claimable"
          valueNumber={gstClaimable}
          value={`Nu. ${gstClaimable.toLocaleString()}`}
          change={0}
          changeType="increase"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
          description="From verified receipts"
        />
        <MetricCard
          title="Pending Review"
          value={pendingReceiptsCount.toString()}
          change={0}
          changeType="neutral"
          trend="neutral"
          icon={<Clock className="h-5 w-5" />}
          description="Receipts awaiting verification"
        />
      </div>

      {/* Main Content Grid with Clerk-like design */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Transactions - Premium version */}
        <PremiumGlassCard
          title="Recent Activity"
          description="Your latest journal entries and transactions"
          className="lg:col-span-4 animate-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="space-y-4">
            {recentTransactions?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No recent activity found.
              </div>
            ) : (
              recentTransactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg animate-in-up"
                  style={{ animationDelay: `${300 + (index * 100)}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.description}
                    </p>
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

            <PremiumButton
              variant="outline"
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
              className="w-full"
              asChild
            >
              View All Transactions
            </PremiumButton>
          </div>
        </PremiumGlassCard>

        {/* Right Sidebar - Premium components */}
        <div className="lg:col-span-3 space-y-6 animate-in-up" style={{ animationDelay: "400ms" }}>
          {/* Workflow Checklist */}
          <WorkflowChecklist />

          {/* Quick Actions with premium styling */}
          <PremiumCard>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <PremiumButton
                variant="outline"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                className="w-full justify-start"
                asChild
              >
                Upload New Receipt
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                leftIcon={<RefreshCwIcon className="h-4 w-4" />}
                className="w-full justify-start"
                asChild
              >
                Match Transactions
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                className="w-full justify-start"
                asChild
              >
                Export BIT Excel
              </PremiumButton>
            </div>
          </PremiumCard>

          {/* Compliance Status with premium styling */}
          <PremiumCard>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    GST Registration
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {org?.gstRegistered ? "Registered" : "Not Registered"}
                  </p>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${org?.gstRegistered ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Organization TPN
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {org?.tpn || "Missing TPN"}
                  </p>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${org?.tpn ? 'bg-green-500' : 'bg-yellow-500'} shadow-sm`} />
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>

      {/* Quick stats section */}
      <div className="grid gap-4 md:grid-cols-3 animate-in-up" style={{ animationDelay: "600ms" }}>
        <PremiumGlassCard
          title="Quick Stats"
          description="Overview of your financial position"
          className="md:col-span-1"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(totalInflow)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">Total Expenses</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(totalOutflow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Net Profit</span>
              <span className={cn(
                "text-lg font-bold",
                (totalInflow - totalOutflow) > 0
                  ? "text-green-600"
                  : "text-red-600"
              )}>
                {formatCurrency(totalInflow - totalOutflow)}
              </span>
            </div>
          </div>
        </PremiumGlassCard>

        {/* Organization TPN Card with premium styling */}
        <PremiumCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Organization Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Organization TPN
                </p>
                <p className="text-xs text-muted-foreground">
                  {org?.tpn || "Missing TPN"}
                </p>
              </div>
              <PremiumButton
                variant="ghost"
                size="sm"
                asChild
              >
                {org?.tpn ? "Update" : "Add"}
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  )
}
