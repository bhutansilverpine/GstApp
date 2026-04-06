"use client"

import { useState } from "react"
import {
  Search,
  ArrowLeftRight,
  IndianRupee,
  Calendar,
  Building2,
  Tag,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatCurrency } from "@/lib/utils"
import { UnmatchedBankTransaction, UnmatchedReceipt } from "./reconciliation-dashboard"

interface ManualMatchProps {
  bankTransactions: UnmatchedBankTransaction[]
  receipts: UnmatchedReceipt[]
  selectedBankId: string | null
  selectedReceiptId: string | null
  onSelectBank: (id: string | null) => void
  onSelectReceipt: (id: string | null) => void
  onMatch: (bankId: string, receiptId: string) => void
}

export function ManualMatch({
  bankTransactions,
  receipts,
  selectedBankId,
  selectedReceiptId,
  onSelectBank,
  onSelectReceipt,
  onMatch,
}: ManualMatchProps) {
  const [bankSearchQuery, setBankSearchQuery] = useState("")
  const [receiptSearchQuery, setReceiptSearchQuery] = useState("")

  const filteredBankTransactions = bankTransactions.filter((t) =>
    t.description.toLowerCase().includes(bankSearchQuery.toLowerCase())
  )

  const filteredReceipts = receipts.filter((r) =>
    r.vendor.toLowerCase().includes(receiptSearchQuery.toLowerCase())
  )

  const selectedBank = bankTransactions.find((t) => t.id === selectedBankId)
  const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId)

  const canMatch = selectedBankId && selectedReceiptId

  const handleMatch = () => {
    if (canMatch) {
      onMatch(selectedBankId!, selectedReceiptId!)
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ArrowLeftRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Manual Matching</h4>
              <p className="text-sm text-muted-foreground">
                Select one bank transaction and one receipt, then click "Match" to create a manual reconciliation.
                Use the search boxes to filter items.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Bank Transactions
              {selectedBankId && (
                <Badge className="ml-auto">1 selected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredBankTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  filteredBankTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() =>
                        onSelectBank(
                          selectedBankId === transaction.id ? null : transaction.id
                        )
                      }
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        selectedBankId === transaction.id
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedBankId === transaction.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            transaction.type === "debit" ? "destructive" : "default"
                          }
                          className="text-xs"
                        >
                          {transaction.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-bold">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Receipts
              {selectedReceiptId && (
                <Badge className="ml-auto">1 selected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search receipts..."
                value={receiptSearchQuery}
                onChange={(e) => setReceiptSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredReceipts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No receipts found
                  </div>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() =>
                        onSelectReceipt(
                          selectedReceiptId === receipt.id ? null : receipt.id
                        )
                      }
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        selectedReceiptId === receipt.id
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : "bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {receipt.vendor}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(receipt.date).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedReceiptId === receipt.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {receipt.category}
                        </Badge>
                        <span className="text-sm font-bold">
                          {formatCurrency(receipt.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Match Summary */}
      {(selectedBank || selectedReceipt) && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold mb-3">Match Preview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBank && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Bank Transaction
                      </p>
                      <div className="p-3 rounded-lg bg-background">
                        <p className="text-sm font-medium">
                          {selectedBank.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedBank.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold mt-2">
                          {formatCurrency(selectedBank.amount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedReceipt && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Receipt
                      </p>
                      <div className="p-3 rounded-lg bg-background">
                        <p className="text-sm font-medium">
                          {selectedReceipt.vendor}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedReceipt.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold mt-2">
                          {formatCurrency(selectedReceipt.amount)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedBank && selectedReceipt && (
                  <div className="mt-4 p-3 rounded-lg bg-background">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount Difference:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.abs(selectedBank.amount - selectedReceipt.amount)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Date Difference:</span>
                      <span className="font-medium">
                        {Math.abs(
                          Math.ceil(
                            (new Date(selectedBank.date).getTime() -
                              new Date(selectedReceipt.date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{" "}
                        days
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  onClick={handleMatch}
                  disabled={!canMatch}
                  size="lg"
                  className="gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Match
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onSelectBank(null)
                    onSelectReceipt(null)
                  }}
                  disabled={!selectedBankId && !selectedReceiptId}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
