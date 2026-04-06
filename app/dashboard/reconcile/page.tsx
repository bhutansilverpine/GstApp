"use client"

import { useState } from "react"
import { ReconciliationDashboard } from "@/components/reconciliation/reconciliation-dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react"

// Mock data - replace with actual API calls
const mockBankTransactions = [
  {
    id: "bank1",
    date: "2026-04-05",
    description: "AMAZON PAYMENTS",
    amount: 4500,
    type: "debit" as const,
  },
  {
    id: "bank2",
    date: "2026-04-04",
    description: "UBER TRIP",
    amount: 850,
    type: "debit" as const,
  },
  {
    id: "bank3",
    date: "2026-04-03",
    description: "RESTAURANT",
    amount: 1800,
    type: "debit" as const,
  },
]

const mockReceipts = [
  {
    id: "receipt1",
    date: "2026-04-05",
    vendor: "Amazon India",
    amount: 4500,
    category: "Office Supplies",
  },
  {
    id: "receipt2",
    date: "2026-04-04",
    vendor: "Uber India",
    amount: 850,
    category: "Travel",
  },
  {
    id: "receipt3",
    date: "2026-04-03",
    vendor: "Pizza Hut",
    amount: 1800,
    category: "Meals",
  },
]

const mockSuggestedMatches = [
  {
    bankTransaction: mockBankTransactions[0],
    receipt: mockReceipts[0],
    confidence: 95,
    reasons: [
      "Exact amount match (₹4,500.00)",
      "Same transaction date",
      "Vendor name similarity detected",
    ],
  },
  {
    bankTransaction: mockBankTransactions[1],
    receipt: mockReceipts[1],
    confidence: 88,
    reasons: [
      "Exact amount match (₹850.00)",
      "Same transaction date",
      "Category matches typical Uber expenses",
    ],
  },
  {
    bankTransaction: mockBankTransactions[2],
    receipt: mockReceipts[2],
    confidence: 92,
    reasons: [
      "Exact amount match (₹1,800.00)",
      "Same transaction date",
      "Amount matches typical restaurant expense",
    ],
  },
]

export default function ReconcilePage() {
  const [completedMatches, setCompletedMatches] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("suggested")

  const handleConfirmMatch = (bankId: string, receiptId: string) => {
    setCompletedMatches(new Set([...completedMatches, bankId]))
    toast.success("Match confirmed successfully")
  }

  const handleRejectMatch = (bankId: string, receiptId: string) => {
    toast.success("Match rejected")
  }

  const handleManualMatch = (bankId: string, receiptId: string) => {
    setCompletedMatches(new Set([...completedMatches, bankId]))
    toast.success("Manual match created")
  }

  const handleSkipTransaction = (bankId: string) => {
    toast.success("Transaction skipped")
  }

  const totalMatches = mockSuggestedMatches.length
  const completedCount = completedMatches.size
  const progressPercent = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank transactions with receipts
          </p>
        </div>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Select Period
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
                <Progress value={progressPercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount} of {totalMatches} matched
                </p>
              </div>
              <ArrowLeftRight className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Suggestions</p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unmatched</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {mockBankTransactions.length - completedCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-500">
                  +12.5%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <ReconciliationDashboard
        bankTransactions={mockBankTransactions}
        receipts={mockReceipts}
        suggestedMatches={mockSuggestedMatches}
        onConfirmMatch={handleConfirmMatch}
        onRejectMatch={handleRejectMatch}
        onManualMatch={handleManualMatch}
        onSkipTransaction={handleSkipTransaction}
      />

      {/* Help Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ArrowLeftRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">About Reconciliation</h4>
              <p className="text-sm text-muted-foreground">
                Reconciliation ensures your bank statements match your recorded transactions.
                Our AI suggests matches based on amount, date, and description similarity.
                You can confirm, reject, or create manual matches as needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
