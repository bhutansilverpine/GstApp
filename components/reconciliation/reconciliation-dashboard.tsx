"use client"

import { useState } from "react"
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MatchCard } from "./match-card"
import { ManualMatch } from "./manual-match"
import { cn, formatCurrency } from "@/lib/utils"

export interface UnmatchedBankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "debit" | "credit"
}

export interface UnmatchedReceipt {
  id: string
  date: string
  vendor: string
  amount: number
  category: string
}

export interface SuggestedMatch {
  bankTransaction: UnmatchedBankTransaction
  receipt: UnmatchedReceipt
  confidence: number
  reasons: string[]
}

interface ReconciliationDashboardProps {
  bankTransactions: UnmatchedBankTransaction[]
  receipts: UnmatchedReceipt[]
  suggestedMatches: SuggestedMatch[]
  onConfirmMatch: (bankId: string, receiptId: string) => void
  onRejectMatch: (bankId: string, receiptId: string) => void
  onManualMatch: (bankId: string, receiptId: string) => void
  onSkipTransaction: (bankId: string) => void
}

export function ReconciliationDashboard({
  bankTransactions,
  receipts,
  suggestedMatches,
  onConfirmMatch,
  onRejectMatch,
  onManualMatch,
  onSkipTransaction,
}: ReconciliationDashboardProps) {
  const [activeTab, setActiveTab] = useState<"suggested" | "manual">("suggested")
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [completedMatches, setCompletedMatches] = useState<Set<string>>(new Set())

  const currentMatch = suggestedMatches[currentMatchIndex]
  const totalMatches = suggestedMatches.length
  const completedCount = completedMatches.size
  const progressPercent = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0

  const handleConfirmMatch = () => {
    if (currentMatch) {
      onConfirmMatch(currentMatch.bankTransaction.id, currentMatch.receipt.id)
      setCompletedMatches(new Set([...completedMatches, currentMatch.bankTransaction.id]))
      goToNextMatch()
    }
  }

  const handleRejectMatch = () => {
    if (currentMatch) {
      onRejectMatch(currentMatch.bankTransaction.id, currentMatch.receipt.id)
      goToNextMatch()
    }
  }

  const handleSkipTransaction = () => {
    if (currentMatch) {
      onSkipTransaction(currentMatch.bankTransaction.id)
      goToNextMatch()
    }
  }

  const goToNextMatch = () => {
    if (currentMatchIndex < suggestedMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1)
    } else {
      setCurrentMatchIndex(0) // Loop back to start
    }
  }

  const goToPreviousMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1)
    }
  }

  const handleManualMatch = (bankId: string, receiptId: string) => {
    onManualMatch(bankId, receiptId)
    setCompletedMatches(new Set([...completedMatches, bankId]))
    // Reset selection
    setSelectedBankId(null)
    setSelectedReceiptId(null)
  }

  // Get unmatched items (not in suggested matches and not completed)
  const matchedBankIds = new Set(suggestedMatches.map(m => m.bankTransaction.id))
  const matchedReceiptIds = new Set(suggestedMatches.map(m => m.receipt.id))

  const unmatchedBankTransactions = bankTransactions.filter(
    t => !matchedBankIds.has(t.id) && !completedMatches.has(t.id)
  )

  const unmatchedReceipts = receipts.filter(
    r => !matchedReceiptIds.has(r.id)
  )

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent.toFixed(0)}%</div>
            <Progress value={progressPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} of {totalMatches} matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suggested Matches
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI-generated suggestions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unmatched Transactions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {unmatchedBankTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need manual review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unmatched Receipts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {unmatchedReceipts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Without bank match
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggested" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Suggested Matches
            {totalMatches > 0 && (
              <Badge variant="secondary">{totalMatches}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Manual Matching
            {(unmatchedBankTransactions.length > 0 || unmatchedReceipts.length > 0) && (
              <Badge variant="secondary">
                {unmatchedBankTransactions.length + unmatchedReceipts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="space-y-4">
          {suggestedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    All caught up!
                  </h3>
                  <p className="text-muted-foreground">
                    No suggested matches pending review.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Match Navigation */}
              {totalMatches > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMatch}
                    disabled={currentMatchIndex === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Match {currentMatchIndex + 1} of {totalMatches}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMatch}
                    disabled={currentMatchIndex === totalMatches - 1}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Current Match */}
              {currentMatch && (
                <MatchCard
                  match={currentMatch}
                  onConfirm={handleConfirmMatch}
                  onReject={handleRejectMatch}
                  onSkip={handleSkipTransaction}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <ManualMatch
            bankTransactions={unmatchedBankTransactions}
            receipts={unmatchedReceipts}
            selectedBankId={selectedBankId}
            selectedReceiptId={selectedReceiptId}
            onSelectBank={setSelectedBankId}
            onSelectReceipt={setSelectedReceiptId}
            onMatch={handleManualMatch}
          />
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      {(unmatchedBankTransactions.length > 0 || unmatchedReceipts.length > 0) && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Unmatched Items Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Unmatched Transactions</h4>
                <div className="space-y-2">
                  {unmatchedBankTransactions.slice(0, 3).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 rounded bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold ml-2">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                  {unmatchedBankTransactions.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{unmatchedBankTransactions.length - 3} more
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Unmatched Receipts</h4>
                <div className="space-y-2">
                  {unmatchedReceipts.slice(0, 3).map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-2 rounded bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {receipt.vendor}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(receipt.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-bold ml-2">
                        {formatCurrency(receipt.amount)}
                      </span>
                    </div>
                  ))}
                  {unmatchedReceipts.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{unmatchedReceipts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
