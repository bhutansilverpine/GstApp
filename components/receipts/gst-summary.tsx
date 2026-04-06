"use client"

import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency } from "@/lib/utils"

interface GSTSummaryData {
  totalGST: number
  claimableGST: number
  nonClaimableGST: number
  totalReceipts: number
  receiptsWithTPN: number
  receiptsWithoutTPN: number
  averageConfidence: number
  monthlyComparison: {
    currentMonth: number
    previousMonth: number
    percentageChange: number
  }
  breakdown: {
    category: string
    amount: number
    percentage: number
    claimable: boolean
  }[]
}

interface GSTSummaryProps {
  data: GSTSummaryData
  onExport?: () => void
  dateRange?: string
}

export function GSTSummary({ data, onExport, dateRange = "This Month" }: GSTSummaryProps) {
  const claimablePercentage = (data.receiptsWithTPN / data.totalReceipts) * 100
  const gstRecoveryRate = (data.claimableGST / data.totalGST) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GST Audit Summary</h2>
          <p className="text-muted-foreground">{dateRange}</p>
        </div>
        {onExport && (
          <Button onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total GST */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total GST
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalGST)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {data.monthlyComparison.percentageChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  data.monthlyComparison.percentageChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                )}
              >
                {Math.abs(data.monthlyComparison.percentageChange).toFixed(1)}%
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Claimable GST */}
        <Card className="border-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-500">
              Claimable GST
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(data.claimableGST)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <Progress value={gstRecoveryRate} className="h-2" />
              <span className="text-xs text-muted-foreground ml-2">
                {gstRecoveryRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Non-Claimable GST */}
        <Card className="border-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-500">
              Non-Claimable GST
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(data.nonClaimableGST)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From {data.receiptsWithoutTPN} receipts without TPN
            </p>
          </CardContent>
        </Card>

        {/* Receipt Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              TPN Coverage
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claimablePercentage.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <Progress value={claimablePercentage} className="h-2" />
              <span className="text-xs text-muted-foreground ml-2">
                {data.receiptsWithTPN}/{data.totalReceipts}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>GST by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.breakdown.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.category}</span>
                      {category.claimable ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Claimable
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Non-Claimable
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold">
                        {formatCurrency(category.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TPN Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>TPN Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">With TPN</span>
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {data.receiptsWithTPN}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(data.claimableGST)} GST claimable
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Without TPN</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {data.receiptsWithoutTPN}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(data.nonClaimableGST)} GST lost
                </p>
              </div>
            </div>

            {/* Average Confidence */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Average AI Confidence</span>
                <Badge variant="outline">
                  {data.averageConfidence.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={data.averageConfidence} className="h-2" />
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Recommendations:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {claimablePercentage < 80 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Request TPN from vendors to increase claimable GST by{" "}
                      {formatCurrency(data.nonClaimableGST)}
                    </span>
                  </li>
                )}
                {data.averageConfidence < 90 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Review {data.totalReceipts} receipts for data accuracy
                    </span>
                  </li>
                )}
                {claimablePercentage >= 80 && data.averageConfidence >= 90 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Excellent compliance! Your GST tracking is optimized.
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">This Month</p>
              <p className="text-3xl font-bold">
                {formatCurrency(data.monthlyComparison.currentMonth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Last Month</p>
              <p className="text-3xl font-bold text-muted-foreground">
                {formatCurrency(data.monthlyComparison.previousMonth)}
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Change</span>
              <div className="flex items-center gap-2">
                {data.monthlyComparison.percentageChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-lg font-bold",
                    data.monthlyComparison.percentageChange >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {data.monthlyComparison.percentageChange >= 0 ? "+" : ""}
                  {data.monthlyComparison.percentageChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
