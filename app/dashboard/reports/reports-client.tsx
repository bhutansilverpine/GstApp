"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Printer,
} from "lucide-react"

interface ReportsClientProps {
  initialData: any
  organizationId: string
}

export function ReportsClient({
  initialData,
  organizationId,
}: ReportsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [reportType, setReportType] = useState("profit-loss")

  const handleExport = (format: "pdf" | "excel") => {
    toast.success(`Report exported as ${format.toUpperCase()}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const incomeStatement = initialData.incomeStatement || {
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    accounts: [],
  }

  const balanceSheet = initialData.balanceSheet || {
    assets: 0,
    liabilities: 0,
    equity: 0,
    accounts: [],
  }

  const cashFlow = initialData.cashFlow || {
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
  }

  const gstReport = initialData.gstReport || {
    gstCollected: 0,
    gstPaid: 0,
    netGST: 0,
    taxableSales: 0,
    taxablePurchases: 0,
  }

  const profitMargin = incomeStatement.revenue > 0 
    ? (incomeStatement.netIncome / incomeStatement.revenue) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate and export financial statements for GST compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="current-quarter">This Quarter</SelectItem>
              <SelectItem value="current-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="gst-report">GST Report</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{incomeStatement.revenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{incomeStatement.expenses.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                <PieChart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{incomeStatement.netIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profit Margin
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profitMargin.toFixed(1)}%
                </div>
                <Progress value={profitMargin} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profit & Loss Statement</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Revenue</h3>
                  {incomeStatement.accounts.filter((a: any) => a.accountType === 'revenue').map((a: any) => (
                    <div key={a.accountId} className="flex justify-between pl-4 border-l-4 border-green-500 text-sm">
                      <span className="text-muted-foreground">{a.accountName}</span>
                      <span className="font-medium">₹{a.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                    <span>Total Revenue</span>
                    <span className="text-green-500">₹{incomeStatement.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Expenses</h3>
                  {incomeStatement.accounts.filter((a: any) => a.accountType === 'expense').map((a: any) => (
                    <div key={a.accountId} className="flex justify-between pl-4 border-l-4 border-red-500 text-sm">
                      <span className="text-muted-foreground">{a.accountName}</span>
                      <span className="font-medium">₹{a.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                    <span>Total Expenses</span>
                    <span className="text-red-500">₹{incomeStatement.expenses.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Income</span>
                    <span className="text-2xl font-bold text-primary">₹{incomeStatement.netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Assets */}
             <Card>
              <CardHeader><CardTitle className="text-green-500">Assets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {balanceSheet.accounts.filter((a: any) => a.accountType === 'asset').map((a: any) => (
                   <div key={a.accountId} className="flex justify-between text-sm pl-3 border-l-2 border-green-500/30">
                     <span>{a.accountName}</span>
                     <span>₹{a.balance.toLocaleString()}</span>
                   </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Assets</span>
                    <span className="text-green-500">₹{balanceSheet.assets.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities */}
            <Card>
              <CardHeader><CardTitle className="text-red-500">Liabilities</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {balanceSheet.accounts.filter((a: any) => a.accountType === 'liability').map((a: any) => (
                   <div key={a.accountId} className="flex justify-between text-sm pl-3 border-l-2 border-red-500/30">
                     <span>{a.accountName}</span>
                     <span>₹{a.balance.toLocaleString()}</span>
                   </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Liabilities</span>
                    <span className="text-red-500">₹{balanceSheet.liabilities.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card>
              <CardHeader><CardTitle className="text-purple-500">Equity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {balanceSheet.accounts.filter((a: any) => a.accountType === 'equity').map((a: any) => (
                   <div key={a.accountId} className="flex justify-between text-sm pl-3 border-l-2 border-purple-500/30">
                     <span>{a.accountName}</span>
                     <span>₹{a.balance.toLocaleString()}</span>
                   </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Equity</span>
                    <span className="text-purple-500">₹{balanceSheet.equity.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Operating</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-500">₹{cashFlow.operatingCashFlow.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Investing</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-500">₹{cashFlow.investingCashFlow.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Financing</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">₹{cashFlow.financingCashFlow.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold">Net Change</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-primary">₹{cashFlow.netCashFlow.toLocaleString()}</div></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gst-report" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>GST Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="text-sm font-medium text-green-500 mb-2">GST Collected (Output)</h4>
                    <p className="text-2xl font-bold">₹{gstReport.gstCollected.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-500 mb-2">GST Paid (Input)</h4>
                    <p className="text-2xl font-bold">₹{gstReport.gstPaid.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="text-sm font-medium text-primary mb-2">Net GST Payable</h4>
                    <p className="text-2xl font-bold">₹{gstReport.netGST.toLocaleString()}</p>
                  </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-sm">
                   <span>Taxable Sales</span>
                   <span>₹{gstReport.taxableSales.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span>Taxable Purchases</span>
                   <span>₹{gstReport.taxablePurchases.toLocaleString()}</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
