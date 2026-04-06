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

// Mock data - replace with actual API calls
const mockAccounts: Account[] = [
  { id: "1", name: "Cash", type: "asset", code: "1000" },
  { id: "2", name: "Bank Account", type: "asset", code: "1100" },
  { id: "3", name: "Accounts Receivable", type: "asset", code: "1200" },
  { id: "4", name: "Office Equipment", type: "asset", code: "1500" },
  { id: "5", name: "Accounts Payable", type: "liability", code: "2000" },
  { id: "6", name: "Owner's Equity", type: "equity", code: "3000" },
  { id: "7", name: "Sales Revenue", type: "revenue", code: "4000" },
  { id: "8", name: "Office Expenses", type: "expense", code: "5000" },
  { id: "9", name: "Rent Expense", type: "expense", code: "5100" },
  { id: "10", name: "Salary Expense", type: "expense", code: "5200" },
]

const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-04-05",
    description: "Office supplies purchase",
    journalEntry: "JE-2026-001",
    lines: [
      { account: "Office Expenses", debit: 2300, credit: 0 },
      { account: "Cash", debit: 0, credit: 2300 },
    ],
    totalDebit: 2300,
    totalCredit: 2300,
    status: "posted",
    createdBy: "John Doe",
    createdAt: "2026-04-05T10:30:00Z",
  },
  {
    id: "2",
    date: "2026-04-04",
    description: "Client payment received",
    journalEntry: "JE-2026-002",
    lines: [
      { account: "Bank Account", debit: 25000, credit: 0 },
      { account: "Accounts Receivable", debit: 0, credit: 25000 },
    ],
    totalDebit: 25000,
    totalCredit: 25000,
    status: "posted",
    createdBy: "Jane Smith",
    createdAt: "2026-04-04T14:20:00Z",
  },
  {
    id: "3",
    date: "2026-04-03",
    description: "Monthly rent payment",
    journalEntry: "JE-2026-003",
    lines: [
      { account: "Rent Expense", debit: 15000, credit: 0 },
      { account: "Bank Account", debit: 0, credit: 15000 },
    ],
    totalDebit: 15000,
    totalCredit: 15000,
    status: "posted",
    createdBy: "John Doe",
    createdAt: "2026-04-03T09:15:00Z",
  },
  {
    id: "4",
    date: "2026-04-02",
    description: "Salary payment",
    journalEntry: "JE-2026-004",
    lines: [
      { account: "Salary Expense", debit: 45000, credit: 0 },
      { account: "Bank Account", debit: 0, credit: 45000 },
    ],
    totalDebit: 45000,
    totalCredit: 45000,
    status: "draft",
    createdBy: "Jane Smith",
    createdAt: "2026-04-02T16:45:00Z",
  },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions)
  const [activeTab, setActiveTab] = useState("list")

  const handleSaveEntry = async (entry: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: entry.date,
      description: entry.description,
      journalEntry: `JE-2026-${String(transactions.length + 1).padStart(3, "0")}`,
      lines: entry.lines.map((line: any) => ({
        account: line.accountName,
        debit: line.debit,
        credit: line.credit,
      })),
      totalDebit: entry.lines.reduce((sum: number, line: any) => sum + line.debit, 0),
      totalCredit: entry.lines.reduce((sum: number, line: any) => sum + line.credit, 0),
      status: "posted",
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
    }

    setTransactions([newTransaction, ...transactions])
    toast.success("Journal entry created successfully")
  }

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))
    toast.success("Transaction deleted")
  }

  const handleReverse = (id: string) => {
    toast.success("Entry reversed successfully")
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
            Manage journal entries and account transactions
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
          <JournalEntry accounts={mockAccounts} onSave={handleSaveEntry} />
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
