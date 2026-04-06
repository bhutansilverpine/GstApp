"use client"

import { useState } from "react"
import { JournalEntry } from "@/components/transactions/journal-entry"
import { TransactionList, Transaction } from "@/components/transactions/transaction-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Account } from "@/components/transactions/account-select"
import {
  FileText,
  Plus,
  BookOpen,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import { createTransaction, postTransaction, deleteTransaction, reverseTransaction } from "@/server/transactions/create"
import { useRouter } from "next/navigation"

interface TransactionsClientProps {
  initialTransactions: any[]
  accounts: Account[]
  organizationId: string
  userId: string
}

export function TransactionsClient({
  initialTransactions,
  accounts,
  organizationId,
  userId,
}: TransactionsClientProps) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeTab, setActiveTab] = useState("list")

  const handleSaveEntry = async (entry: any) => {
    try {
      const response = await createTransaction(
        {
          organizationId,
          date: new Date(entry.date),
          description: entry.description,
          journalType: "general",
          lines: entry.lines.map((line: any) => ({
            accountId: line.accountId,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            description: line.description,
          })),
        },
        organizationId,
        userId
      )

      if (response.success) {
        toast.success("Journal entry created successfully")
        setActiveTab("list")
        router.refresh()
      } else {
        toast.error(response.error || "Failed to create transaction")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteTransaction(id, organizationId)
      if (response.success) {
        toast.success("Transaction deleted")
        setTransactions(transactions.filter((t) => t.id !== id))
      } else {
        toast.error(response.error || "Failed to delete transaction")
      }
    } catch (error) {
      toast.error("An error occurred during deletion")
    }
  }

  const handleReverse = async (id: string) => {
    try {
      const response = await reverseTransaction(id, organizationId, "Manual reversal by user")
      if (response.success) {
        toast.success("Entry reversed successfully")
        router.refresh()
      } else {
        toast.error(response.error || "Failed to reverse entry")
      }
    } catch (error) {
      toast.error("An error occurred during reversal")
    }
  }

  const totalValue = transactions.reduce((sum, t) => sum + t.totalDebit, 0)
  const postedCount = transactions.filter((t) => t.status === "posted").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage journal entries and account transactions for your organization
          </p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab("create")}>
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posted</p>
                <p className="text-2xl font-bold text-green-500">{postedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft Entries</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {transactions.filter((t) => t.status === "draft").length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Journal Entries</TabsTrigger>
          <TabsTrigger value="create">Create Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
            onReverse={handleReverse}
            onView={(transaction) => console.log("View", transaction)}
            onEdit={(transaction) => console.log("Edit", transaction)}
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <JournalEntry accounts={accounts} onSave={handleSaveEntry} />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Double-Entry Accounting</h4>
              <p className="text-sm text-muted-foreground">
                Every journal entry must maintain the accounting equation: Assets = Liabilities + Equity.
                Total debits must always equal total credits. Each transaction affects at least two accounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
