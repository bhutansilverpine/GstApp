import { MetricCard } from "@/components/dashboard/metric-card"
import { GlassCard, StatCard } from "@/components/dashboard/glass-card"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import {
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
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
          <Button size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="₹45,231.89"
          change={20.1}
          changeType="increase"
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
          description="From last month"
        />
        <MetricCard
          title="Invoices Generated"
          value="245"
          change={15.3}
          changeType="increase"
          trend="up"
          icon={<FileText className="h-4 w-4" />}
          description="From last month"
        />
        <MetricCard
          title="Active Clients"
          value="1,234"
          change={8.2}
          changeType="increase"
          trend="up"
          icon={<Users className="h-4 w-4" />}
          description="From last month"
        />
        <MetricCard
          title="GST Paid"
          value="₹12,345.67"
          change={-2.4}
          changeType="decrease"
          trend="down"
          icon={<TrendingUp className="h-4 w-4" />}
          description="From last month"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Activity */}
        <GlassCard
          title="Recent Activity"
          description="Your latest invoices and transactions"
          className="lg:col-span-4"
        >
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice #{1000 + i}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {i} day{i !== 1 ? "s" : ""} ago
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{1000 * i}.00</p>
                  <p className="text-xs text-green-500 flex items-center justify-end gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    Paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions & Stats */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions */}
          <GlassCard title="Quick Actions">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Create New Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="h-4 w-4" />
                File GST Return
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Add New Client
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                Download Reports
              </Button>
            </div>
          </GlassCard>

          {/* Upcoming Deadlines */}
          <GlassCard title="Upcoming Deadlines">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">GSTR-1 Filing</p>
                  <p className="text-xs text-muted-foreground">Due in 3 days</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">GSTR-3B Filing</p>
                  <p className="text-xs text-muted-foreground">Due in 7 days</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Quarterly Report</p>
                  <p className="text-xs text-muted-foreground">Due in 14 days</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <GlassCard title="Revenue Overview">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">₹45,231.89</p>
          </div>
          <Select defaultValue="30">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-64 rounded-lg bg-muted/50 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Chart visualization will be rendered here</p>
        </div>
      </GlassCard>
    </div>
  )
}
