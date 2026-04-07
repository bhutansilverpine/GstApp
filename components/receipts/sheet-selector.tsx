"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FolderOpen, Plus, Check } from "lucide-react"
import { toast } from "sonner"

interface Spreadsheet {
  id: string
  name: string
  url: string
}

interface SheetSelectorProps {
  onSelect: (spreadsheetId: string, sheetName: string, url: string) => void
  onCancel: () => void
  type?: "receipts" | "transactions" | "expenses"
}

export function SheetSelector({
  onSelect,
  onCancel,
  type = "receipts"
}: SheetSelectorProps) {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newSheetName, setNewSheetName] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    loadSpreadsheets()
  }, [])

  const loadSpreadsheets = async () => {
    try {
      const response = await fetch("/api/google-sheets?action=list")
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setSpreadsheets(data.spreadsheets || [])
    } catch (error) {
      toast.error("Failed to load spreadsheets")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = async () => {
    if (!newSheetName.trim()) {
      toast.error("Please enter a name")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newSheetName,
          type,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      toast.success("Spreadsheet created!")
      onSelect(data.spreadsheetId, data.sheetName, data.spreadsheetUrl)
    } catch (error) {
      toast.error("Failed to create spreadsheet")
    } finally {
      setCreating(false)
    }
  }

  const handleSelectExisting = () => {
    if (!selectedId) {
      toast.error("Please select a spreadsheet")
      return
    }

    const selected = spreadsheets.find((s) => s.id === selectedId)
    if (selected) {
      onSelect(selected.id, "Sheet1", selected.url)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Select Google Sheet
        </CardTitle>
        <CardDescription>
          Choose where to save your {type} data, or create a new spreadsheet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showNewForm ? (
          <>
            <div className="space-y-2">
              <Label>Existing Spreadsheets</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {spreadsheets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No spreadsheets found
                  </p>
                ) : (
                  spreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setSelectedId(sheet.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedId === sheet.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{sheet.name}</span>
                        {selectedId === sheet.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSelectExisting}
                disabled={!selectedId || spreadsheets.length === 0}
              >
                Select
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newSheetName">Spreadsheet Name</Label>
                <Input
                  id="newSheetName"
                  placeholder={`My ${type} - ${new Date().toLocaleDateString()}`}
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                <p>A new spreadsheet will be created in your Google Drive with:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Formatted headers</li>
                  <li>Frozen header row</li>
                  <li>Ready for data entry</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewForm(false)}
                disabled={creating}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateNew}
                disabled={creating || !newSheetName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
