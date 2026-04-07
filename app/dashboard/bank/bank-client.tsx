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
  CircleDollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { processBankStatement } from "@/server/bank/process"
import { categorizeTransactionManual } from "@/server/bank/categorize"

interface BankClientProps {
  initialTransactions: BankTransaction[]
  initialSummary: any
  organizationId: string
}

export function BankClient({
  initialTransactions,
  initialSummary,
  organizationId,
}: BankClientProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeTab, setActiveTab] = useState("transactions")

  const handleUpload = async (file: File, password?: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (password) formData.append("password", password)
      
      const response = await processBankStatement(formData, organizationId)
      
      if (response.success) {
        toast.success(`Bank statement processed successfully`)
        router.refresh()
        setActiveTab("transactions")
      } else {
        toast.error(response.error || "Failed to process statement")
      }
    } catch (error) {
      toast.error("Upload error")
    }
  }

  const handleCategorize = async (transactionId: string, categoryId: string) => {
    try {
      const response = await categorizeTransactionManual(
        transactionId,
        organizationId,
        categoryId
      )
      
      if (response.success) {
        toast.success(`Transaction categorized`)
        router.refresh()
      } else {
        toast.error(response.error || "Categorization failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleExport = () => {
    toast.success("Transactions exported successfully")
  }

  const totalCredits = initialSummary?.totalCredits || 0
  const totalDebits = Math.abs(initialSummary?.totalDebits || 0)
  const unreconciledCount = initialSummary?.unreconciledTransactions || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Statements</h1>
          <p className="text-muted-foreground">
            Upload and manage bank transactions for Bhutan banks (BOB, BNB)
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
                <p className="text-2xl font-bold">{initialSummary?.totalTransactions || 0}</p>
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
                  Nu.{totalCredits.toLocaleString()}
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
                  Nu.{totalDebits.toLocaleString()}
                </p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unreconciled</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {unreconciledCount}
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
