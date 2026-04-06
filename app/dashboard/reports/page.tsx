"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

// Mock data - replace with actual API calls
const mockProfitLossData = {
  revenue: {
    current: 450000,
    previous: 380000,
    growth: 18.4,
  },
  expenses: {
    current: 280000,
    previous: 250000,
    growth: 12.0,
  },
  netProfit: {
    current: 170000,
    previous: 130000,
    growth: 30.8,
  },
  profitMargin: {
    current: 37.8,
    previous: 34.2,
  },
}

const mockBalanceSheetData = {
  assets: {
    current: 520000,
    fixed: 380000,
    total: 900000,
  },
  liabilities: {
    current: 180000,
    longTerm: 120000,
    total: 300000,
  },
  equity: {
    capital: 500000,
    retained: 100000,
    total: 600000,
  },
}

const mockCashFlowData = {
  operating: 85000,
  investing: -45000,
  financing: 20000,
  netChange: 60000,
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [reportType, setReportType] = useState("profit-loss")

  const handleExport = (format: "pdf" | "excel") => {
    toast.success(`Report exported as ${format.toUpperCase()}`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate and export financial statements
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
              <SelectItem value="custom">Custom Range</SelectItem>
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
          {/* Summary Cards */}
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
                  ₹{mockProfitLossData.revenue.current.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">
                    +{mockProfitLossData.revenue.growth}%
                  </span>
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
                  ₹{mockProfitLossData.expenses.current.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500 font-medium">
                    +{mockProfitLossData.expenses.growth}%
                  </span>
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
                  ₹{mockProfitLossData.netProfit.current.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">
                    +{mockProfitLossData.netProfit.growth}%
                  </span>
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
                  {mockProfitLossData.profitMargin.current}%
                </div>
                <Progress value={mockProfitLossData.profitMargin.current} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Profit & Loss */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profit & Loss Statement</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Revenue</h3>
                  <div className="space-y-2 pl-4 border-l-4 border-green-500">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sales Revenue</span>
                      <span className="font-medium">₹420,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Income</span>
                      <span className="font-medium">₹30,000</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total Revenue</span>
                      <span className="text-green-500">₹450,000</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Expenses</h3>
                  <div className="space-y-2 pl-4 border-l-4 border-red-500">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost of Goods Sold</span>
                      <span className="font-medium">₹180,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operating Expenses</span>
                      <span className="font-medium">₹85,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Administrative</span>
                      <span className="font-medium">₹15,000</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total Expenses</span>
                      <span className="text-red-500">₹280,000</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Profit</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{mockProfitLossData.netProfit.current.toLocaleString()}
                    </span>
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
              <CardHeader>
                <CardTitle className="text-green-500">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Current Assets
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-green-500/30">
                    <div className="flex justify-between text-sm">
                      <span>Cash & Bank</span>
                      <span>₹280,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accounts Receivable</span>
                      <span>₹150,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inventory</span>
                      <span>₹90,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Fixed Assets
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-green-500/30">
                    <div className="flex justify-between text-sm">
                      <span>Equipment</span>
                      <span>₹250,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Furniture</span>
                      <span>₹80,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Buildings</span>
                      <span>₹50,000</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Assets</span>
                    <span className="text-green-500">
                      ₹{mockBalanceSheetData.assets.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-500">Liabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Current Liabilities
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-red-500/30">
                    <div className="flex justify-between text-sm">
                      <span>Accounts Payable</span>
                      <span>₹120,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Short-term Debt</span>
                      <span>₹60,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Long-term Liabilities
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-red-500/30">
                    <div className="flex justify-between text-sm">
                      <span>Long-term Debt</span>
                      <span>₹100,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Other Liabilities</span>
                      <span>₹20,000</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Liabilities</span>
                    <span className="text-red-500">
                      ₹{mockBalanceSheetData.liabilities.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-500">Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 pl-3 border-l-2 border-purple-500/30">
                  <div className="flex justify-between text-sm">
                    <span>Owner's Capital</span>
                    <span>₹500,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Retained Earnings</span>
                    <span>₹100,000</span>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Equity</span>
                    <span className="text-purple-500">
                      ₹{mockBalanceSheetData.equity.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t bg-purple-500/10 p-3 rounded">
                  <div className="flex justify-between font-semibold">
                    <span>Total Liabilities & Equity</span>
                    <span className="text-primary">
                      ₹{(
                        mockBalanceSheetData.liabilities.total +
                        mockBalanceSheetData.equity.total
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operating Activities
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  ₹{mockCashFlowData.operating.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Investing Activities
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  ₹{mockCashFlowData.investing.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Financing Activities
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{mockCashFlowData.financing.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Cash Flow
                </CardTitle>
                <PieChart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ₹{mockCashFlowData.netChange.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Operating Activities</h4>
                  <div className="space-y-2 pl-4 border-l-4 border-green-500">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Income</span>
                      <span>₹120,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depreciation</span>
                      <span>₹15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accounts Receivable</span>
                      <span>-₹30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accounts Payable</span>
                      <span>-₹20,000</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Net Cash from Operations</span>
                      <span className="text-green-500">₹85,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Investing Activities</h4>
                  <div className="space-y-2 pl-4 border-l-4 border-red-500">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equipment Purchase</span>
                      <span>-₹40,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asset Sales</span>
                      <span>-₹5,000</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Net Cash from Investing</span>
                      <span className="text-red-500">-₹45,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Financing Activities</h4>
                  <div className="space-y-2 pl-4 border-l-4 border-purple-500">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Proceeds</span>
                      <span>₹25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dividends Paid</span>
                      <span>-₹5,000</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Net Cash from Financing</span>
                      <span>₹20,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst-report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GST Summary Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="text-sm font-medium text-green-500 mb-2">
                      GST Collected (Output)
                    </h4>
                    <p className="text-2xl font-bold">₹45,000</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-500 mb-2">
                      GST Paid (Input)
                    </h4>
                    <p className="text-2xl font-bold">₹28,500</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Net GST Payable
                    </h4>
                    <p className="text-2xl font-bold">₹16,500</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Detailed Breakdown</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Sales (18% GST)</p>
                          <p className="text-sm text-muted-foreground">
                            250 transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹35,000</p>
                          <p className="text-sm text-muted-foreground">
                            on ₹1,94,444 sales
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Purchases (18% GST)</p>
                          <p className="text-sm text-muted-foreground">
                            180 transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹22,500</p>
                          <p className="text-sm text-muted-foreground">
                            on ₹1,25,000 purchases
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-yellow-500">
                            Non-Claimable GST
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expenses without TPN
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-yellow-500">₹6,000</p>
                          <p className="text-sm text-muted-foreground">
                            Lost credit
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
