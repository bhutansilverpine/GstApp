"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, Check, AlertCircle, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ExtractedReceiptData {
  date: string
  vendor: string
  amount: number
  gstAmount: number
  tpn?: string
  category: string
  description?: string
}

type FlowStep = "upload" | "select-sheet" | "extracting" | "review" | "complete"

interface ReceiptUploadFlowProps {
  organizationId: string
  onComplete?: (data: ExtractedReceiptData) => void
}

export function ReceiptUploadFlow({ organizationId, onComplete }: ReceiptUploadFlowProps) {
  const [step, setStep] = useState<FlowStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null)
  const [sheetInfo, setSheetInfo] = useState<{ id: string; name: string; url: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    setFile(uploadedFile)

    // Create preview
    if (uploadedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(uploadedFile)
    } else {
      setPreview(null)
    }

    // Move to sheet selection
    setStep("select-sheet")
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  const handleSheetSelect = async (spreadsheetId: string, sheetName: string, url: string) => {
    setSheetInfo({ id: spreadsheetId, name: sheetName, url })
    setStep("extracting")

    // Extract data from receipt
    await extractReceiptData()
  }

  const extractReceiptData = async () => {
    if (!file) return

    try {
      // For images, use Vision API to extract text
      if (file.type.startsWith("image/")) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/receipts/extract", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (data.error) {
          toast.error(data.error)
          // Set default values for manual entry
          setExtractedData({
            date: new Date().toISOString().split("T")[0],
            vendor: "",
            amount: 0,
            gstAmount: 0,
            category: "General",
            description: "",
          })
          setStep("review")
          return
        }

        setExtractedData(data.data)
      } else {
        // For PDF, we'd need a different extraction method
        // For now, set default values
        setExtractedData({
          date: new Date().toISOString().split("T")[0],
          vendor: "",
          amount: 0,
          gstAmount: 0,
          category: "General",
          description: file.name,
        })
      }

      setStep("review")
    } catch (error) {
      toast.error("Failed to extract receipt data")
      setStep("upload")
    }
  }

  const handleSaveToSheet = async () => {
    if (!extractedData || !sheetInfo) return

    setSaving(true)
    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appendRow",
          spreadsheetId: sheetInfo.id,
          sheetName: sheetInfo.name,
          values: [
            extractedData.date,
            extractedData.vendor,
            extractedData.amount,
            extractedData.gstAmount,
            extractedData.tpn || "",
            extractedData.category,
            extractedData.description || "",
            preview || "",
          ],
        }),
      })

      if (response.ok) {
        toast.success("Saved to Google Sheet!")
        setStep("complete")
        onComplete?.(extractedData)
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save to sheet")
    } finally {
      setSaving(false)
    }
  }

  const handleDataChange = (field: keyof ExtractedReceiptData, value: string | number) => {
    setExtractedData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  // Render different steps
  if (step === "upload") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
          <CardDescription>
            Upload a receipt image or PDF. AI will extract the data and save it to your Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? "Drop your receipt here" : "Upload receipt"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Drag and drop, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: JPG, PNG, PDF (max 10MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === "select-sheet") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <SheetSelector
          onSelect={handleSheetSelect}
          onCancel={() => setStep("upload")}
          type="receipts"
        />
      </div>
    )
  }

  if (step === "extracting") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">Analyzing receipt...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Extracting vendor, amount, GST, and other details
          </p>
        </CardContent>
      </Card>
    )
  }

  if (step === "review" && extractedData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Review Extracted Data</CardTitle>
          <CardDescription>
            Verify and edit the extracted information before saving to{" "}
            <a
              href={sheetInfo?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 inline-flex"
            >
              Google Sheet
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview Image */}
          {preview && (
            <div className="rounded-lg overflow-hidden border">
              <img src={preview} alt="Receipt preview" className="max-h-48 w-full object-contain bg-muted" />
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={extractedData.date}
                onChange={(e) => handleDataChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input
                placeholder="Vendor name"
                value={extractedData.vendor}
                onChange={(e) => handleDataChange("vendor", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (Nu.)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={extractedData.amount}
                onChange={(e) => handleDataChange("amount", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>GST Amount (Nu.)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={extractedData.gstAmount}
                onChange={(e) => handleDataChange("gstAmount", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>TPN (Optional)</Label>
              <Input
                placeholder="Vendor Tax ID"
                value={extractedData.tpn || ""}
                onChange={(e) => handleDataChange("tpn", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={extractedData.category}
                onChange={(e) => handleDataChange("category", e.target.value)}
              >
                <option value="General">General</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Travel">Travel</option>
                <option value="Meals">Meals & Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Rent">Rent</option>
                <option value="Professional Fees">Professional Fees</option>
                <option value="Inventory">Inventory</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Additional notes"
              value={extractedData.description || ""}
              onChange={(e) => handleDataChange("description", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("upload")}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveToSheet}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save to Sheet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === "complete") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Receipt Saved!</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Your receipt has been extracted and saved to your Google Sheet.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(sheetInfo?.url, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Sheet
            </Button>
            <Button onClick={() => setStep("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
