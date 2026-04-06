"use client"

import {
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Calendar,
  Building2,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency } from "@/lib/utils"
import { SuggestedMatch } from "./reconciliation-dashboard"

interface MatchCardProps {
  match: SuggestedMatch
  onConfirm: () => void
  onReject: () => void
  onSkip: () => void
}

export function MatchCard({ match, onConfirm, onReject, onSkip }: MatchCardProps) {
  const { bankTransaction, receipt, confidence, reasons } = match

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return { label: "High", className: "bg-green-500/10 text-green-500 border-green-500/20" }
    if (score >= 70) return { label: "Medium", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
    return { label: "Low", className: "bg-red-500/10 text-red-500 border-red-500/20" }
  }

  const confidenceBadge = getConfidenceBadge(confidence)

  // Calculate amount difference
  const amountDiff = Math.abs(bankTransaction.amount - receipt.amount)
  const amountDiffPercent = bankTransaction.amount > 0
    ? (amountDiff / bankTransaction.amount) * 100
    : 0

  // Calculate date difference
  const dateDiff = Math.abs(
    new Date(bankTransaction.date).getTime() - new Date(receipt.date).getTime()
  )
  const dateDiffDays = Math.ceil(dateDiff / (1000 * 60 * 60 * 24))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Suggested Match
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and confirm if this transaction matches the receipt
            </p>
          </div>
          <Badge className={cn("gap-1", confidenceBadge.className)}>
            <CheckCircle2 className="h-3 w-3" />
            {confidenceBadge.label} Confidence ({confidence}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Confidence Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Match Confidence</span>
            <span className={cn("text-sm font-bold", getConfidenceColor(confidence))}>
              {confidence}%
            </span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Bank Transaction */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Bank Transaction
            </h3>
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(bankTransaction.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="text-sm font-medium text-right">
                  {bankTransaction.description}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {formatCurrency(bankTransaction.amount)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge
                  variant={bankTransaction.type === "debit" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {bankTransaction.type.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>

          {/* Receipt */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Receipt
            </h3>
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(receipt.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vendor</span>
                <span className="text-sm font-medium text-right">
                  {receipt.vendor}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">
                    {formatCurrency(receipt.amount)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="secondary" className="text-xs">
                  {receipt.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Warnings */}
        {(amountDiffPercent > 5 || dateDiffDays > 7) && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-yellow-500">
                  Potential Discrepancies
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {amountDiffPercent > 5 && (
                    <li>
                      • Amount difference: {formatCurrency(amountDiff)} ({amountDiffPercent.toFixed(1)}%)
                    </li>
                  )}
                  {dateDiffDays > 7 && (
                    <li>
                      • Date difference: {dateDiffDays} days
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* AI Reasons */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Why AI Suggested This Match
          </h4>
          <div className="space-y-2">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onConfirm}
            className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
            size="lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Match
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1 gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            size="lg"
          >
            <XCircle className="h-4 w-4" />
            Not a Match
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="gap-2"
            size="lg"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Keyboard shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> Confirm •
            <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">Esc</kbd> Reject •
            <kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">S</kbd> Skip
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
