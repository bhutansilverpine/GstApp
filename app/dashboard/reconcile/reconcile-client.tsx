"use client"

import { useState, useMemo } from "react"
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
import { useRouter } from "next/navigation"
import { confirmMatch, rejectMatch, manualMatch } from "@/server/reconciliation/confirm"

interface ReconcileClientProps {
  bankTransactions: any[]
  receipts: any[]
  suggestedMatches: any[]
  organizationId: string
}

export function ReconcileClient({
  bankTransactions,
  receipts,
  suggestedMatches,
  organizationId,
}: ReconcileClientProps) {
  const router = useRouter()
  const [completedMatches, setCompletedMatches] = useState<Set<string>>(new Set())

  const handleConfirmMatch = async (bankId: string, receiptId: string) => {
    try {
      const response = await confirmMatch(bankId, receiptId, organizationId)
      if (response.success) {
        setCompletedMatches(new Set([...completedMatches, bankId]))
        toast.success("Match confirmed successfully")
        router.refresh()
      } else {
        toast.error(response.error || "Confirmation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleRejectMatch = async (bankId: string, receiptId: string) => {
    try {
      const response = await rejectMatch(bankId, receiptId, organizationId)
      if (response.success) {
        toast.success("Match rejected")
        router.refresh()
      } else {
        toast.error(response.error || "Rejection failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleManualMatch = async (bankId: string, receiptId: string) => {
    try {
      const response = await manualMatch(bankId, receiptId, organizationId)
      if (response.success) {
        setCompletedMatches(new Set([...completedMatches, bankId]))
        toast.success("Manual match created")
        router.refresh()
      } else {
        toast.error(response.error || "Manual match failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleSkipTransaction = (bankId: string) => {
    toast.info("Transaction skipped")
  }

  const totalPossibleMatches = suggestedMatches.length
  const completedCount = completedMatches.size
  const progressPercent = totalPossibleMatches > 0 ? (completedCount / totalPossibleMatches) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank transactions with receipts for accurate GST claiming
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
                  {completedCount} of {totalPossibleMatches} matched
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
                <p className="text-2xl font-bold">{suggestedMatches.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unmatched Bank</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {bankTransactions.length}
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
                <p className="text-sm text-muted-foreground">Unmatched Receipts</p>
                <p className="text-2xl font-bold text-blue-500">
                  {receipts.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <ReconciliationDashboard
        bankTransactions={bankTransactions}
        receipts={receipts}
        suggestedMatches={suggestedMatches}
        onConfirmMatch={handleConfirmMatch}
        onRejectMatch={handleRejectMatch}
        onManualMatch={handleManualMatch}
        onSkipTransaction={handleSkipTransaction}
      />
    </div>
  )
}
