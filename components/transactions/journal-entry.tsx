"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Save,
  CircleDollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AccountSelect, Account } from "./account-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn, formatCurrency } from "@/lib/utils"

export interface JournalEntryLine {
  id: string
  accountId: string
  accountName: string
  debit: number
  credit: number
  description: string
}

interface JournalEntryProps {
  onSave: (entry: {
    date: string
    description: string
    lines: JournalEntryLine[]
  }) => Promise<void>
  accounts?: Account[]
}

export function JournalEntry({ onSave, accounts = [] }: JournalEntryProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      id: "1",
      accountId: "",
      accountName: "",
      debit: 0,
      credit: 0,
      description: "",
    },
    {
      id: "2",
      accountId: "",
      accountName: "",
      debit: 0,
      credit: 0,
      description: "",
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        accountId: "",
        accountName: "",
        debit: 0,
        credit: 0,
        description: "",
      },
    ])
  }

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter((line) => line.id !== id))
    } else {
      setError("Journal entries must have at least 2 lines")
    }
  }

  const updateLine = (id: string, updates: Partial<JournalEntryLine>) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, ...updates } : line
      )
    )
    setError(null)
  }

  const handleAccountSelect = (lineId: string, accountId: string, accountName: string) => {
    updateLine(lineId, { accountId, accountName })
  }

  const handleDebitChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0
    updateLine(id, { debit: numValue, credit: 0 })
  }

  const handleCreditChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0
    updateLine(id, { credit: numValue, debit: 0 })
  }

  const validateEntry = (): boolean => {
    if (!description.trim()) {
      setError("Please provide a description for this journal entry")
      return false
    }

    if (lines.some((line) => !line.accountId)) {
      setError("All lines must have an account selected")
      return false
    }

    if (lines.some((line) => line.debit === 0 && line.credit === 0)) {
      setError("All lines must have either a debit or credit amount")
      return false
    }

    if (!isBalanced) {
      setError(
        `Debits (${formatCurrency(totalDebits)}) must equal credits (${formatCurrency(totalCredits)})`
      )
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateEntry()) return

    setIsSaving(true)
    setError(null)

    try {
      await onSave({
        date,
        description,
        lines: lines.filter((line) => line.debit > 0 || line.credit > 0),
      })
      setSuccess(true)

      // Reset form
      setDate(new Date().toISOString().split("T")[0])
      setDescription("")
      setLines([
        {
          id: "1",
          accountId: "",
          accountName: "",
          debit: 0,
          credit: 0,
          description: "",
        },
        {
          id: "2",
          accountId: "",
          accountName: "",
          debit: 0,
          credit: 0,
          description: "",
        },
      ])

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save journal entry")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Create Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter journal entry description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Journal Entry Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Entry Lines</Label>
              <Button onClick={addLine} size="sm" variant="outline" className="gap-1">
                <Plus className="h-3 w-3" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted font-medium text-sm">
                <div className="col-span-4">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-1"></div>
              </div>

              {/* Lines */}
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-4 p-3 border-t items-center"
                >
                  <div className="col-span-4">
                    <AccountSelect
                      accounts={accounts}
                      selectedAccountId={line.accountId}
                      onSelect={(accountId, accountName) =>
                        handleAccountSelect(line.id, accountId, accountName)
                      }
                      placeholder="Select account"
                    />
                  </div>

                  <div className="col-span-3">
                    <Input
                      placeholder="Line description"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, { description: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="relative">
                      <CircleDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.debit || ""}
                        onChange={(e) => handleDebitChange(line.id, e.target.value)}
                        className="pl-6 text-right text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="relative">
                      <CircleDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.credit || ""}
                        onChange={(e) => handleCreditChange(line.id, e.target.value)}
                        className="pl-6 text-right text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 border-t font-medium">
                <div className="col-span-4">Totals</div>
                <div className="col-span-3"></div>
                <div className="col-span-2 text-right">
                  {formatCurrency(totalDebits)}
                </div>
                <div className="col-span-2 text-right">
                  {formatCurrency(totalCredits)}
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                {isBalanced
                  ? "Entry is balanced"
                  : `Difference: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={!isBalanced || isSaving}
              className="gap-2"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Entry"}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Journal entry saved successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Double-Entry Accounting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Every journal entry must follow double-entry accounting principles:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Total debits must equal total credits</li>
            <li>Each transaction affects at least two accounts</li>
            <li>Assets and expenses increase with debits</li>
            <li>Liabilities, equity, and revenue increase with credits</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
