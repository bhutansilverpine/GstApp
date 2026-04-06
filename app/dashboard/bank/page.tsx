"use client"

import { useState } from "react"
import { BankUpload } from "@/components/bank/bank-upload"
import { TransactionList, BankTransaction } from "@/components/bank/transaction-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Building2,
  ArrowUpDown,
  IndianRupee,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

// Mock data - replace with actual API calls
const mockBankTransactions: BankTransaction[] = [
  {
    id: "1",
    date: "2026-04-05",
    description: "AMAZON PAYMENTS",
    amount: -4500,
    type: "debit",
    balance: 45000,
    category: "Office Supplies",
    status: "reconciled",
    reference: "TXN123456",
  },
  {
    id: "2",
    date: "2026-04-04",
    description: "CLIENT PAYMENT - ABC CORP",
    amount: 25000,
    type: "credit",
    balance: 49500,
    category: "Sales",
    status: "reconciled",
    reference: "TXN123457",
  },
  {
    id: "3",
    date: "2026-04-03",
    description: "UBER TRIP",
    amount: -850,
    type: "debit",
    balance: 24500,
    status: "uncategorized",
    reference: "TXN123458",
  },
  {
    id: "4",
    date: "2026-04-02",
    description: "SALARY CREDIT",
    amount: -45000,
    type: "debit",
    balance: 25350,
    category: "Payroll",
    status: "categorized",
    reference: "TXN123459",
  },
  {
    id: "5",
    date: "2026-04-01",
    description: "RENT PAYMENT",
    amount: -15000,
    type: "debit",
    balance: 70350,
    category: "Rent",
    status: "reconciled",
    reference: "TXN123460",
  },
]

export default function BankPage() {
  const [transactions, setTransactions] = useState(mockBankTransactions)
  const [activeTab, setActiveTab] = useState("transactions")

  const handleUpload = async (file: File, password?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    toast.success(`Bank statement "${file.name}" uploaded successfully`)
    // In real app, this would process the file and add transactions
  }

  const handleCategorize = (transactionId: string, category: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === transactionId
          ? { ...t, category, status: "categorized" as const }
          : t
      )
    )
    toast.success(`Transaction categorized as "${category}"`)
  }

  const handleExport = () => {
    // Export functionality
    toast.success("Transactions exported successfully")
  }

  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const uncategorizedCount = transactions.filter(
    (t) => t.status === "uncategorized"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Statements</h1>
          <p className="text-muted-foreground">
            Upload and manage bank transactions
          </p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab("upload")}>
          <Building2 className="h-4 w-4" />
          Upload Statement
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold text-green-500">
                  ₹{totalCredits.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold text-red-500">
                  ₹{totalDebits.toLocaleString()}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uncategorized</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {uncategorizedCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="upload">Upload Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionList
            transactions={transactions}
            onCategorize={handleCategorize}
            onExport={handleExport}
            onViewDetails={(transaction) => console.log("View", transaction)}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <BankUpload onUpload={handleUpload} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
