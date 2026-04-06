"use client"

import { useState } from "react"
import { Upload, FileText, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface BankUploadProps {
  onUpload: (file: File, password?: string) => Promise<void>
  supportedFormats?: string[]
  maxSize?: number
}

export function BankUpload({
  onUpload,
  supportedFormats = [".pdf", ".csv", ".xls", ".xlsx"],
  maxSize = 25 * 1024 * 1024, // 25MB
}: BankUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
      return
    }

    // Check file format
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format. Please upload ${supportedFormats.join(", ")}`)
      return
    }

    setSelectedFile(file)
    setError(null)
    setSuccess(false)

    // Check if PDF might require password (basic check)
    if (fileExtension === ".pdf") {
      // In a real implementation, you might want to check the PDF structure
      // For now, we'll give users the option to provide a password
      setRequiresPassword(true)
    } else {
      setRequiresPassword(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(progress)
      }

      await onUpload(selectedFile, password || undefined)
      setSuccess(true)
      setSelectedFile(null)
      setPassword("")
      setRequiresPassword(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      const input = document.createElement("input")
      input.type = "file"
      input.files = e.dataTransfer.files
      handleFileSelect({ target: input } as any)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed transition-all hover:border-primary/50 cursor-pointer"
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input
            type="file"
            id="bank-statement-upload"
            className="hidden"
            accept={supportedFormats.join(",")}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <label
            htmlFor="bank-statement-upload"
            className="cursor-pointer text-center"
          >
            <div className="mb-4 rounded-full p-4 bg-primary/10 text-primary">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Upload Bank Statement
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your statement here, or click to browse
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported formats: {supportedFormats.join(", ")}</p>
              <p>Maximum file size: {maxSize / 1024 / 1024}MB</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {selectedFile && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null)
                      setPassword("")
                      setRequiresPassword(false)
                      setError(null)
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Password Input (if required) */}
              {requiresPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">PDF Password (Optional)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password if PDF is protected"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      disabled={isUploading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank if your PDF is not password-protected
                  </p>
                </div>
              )}

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
                    Bank statement uploaded successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Upload Button */}
              {!isUploading && !success && (
                <Button
                  onClick={handleUpload}
                  className="w-full"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Statement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-sm font-semibold mb-3">Supported Banks</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "HDFC Bank",
              "ICICI Bank",
              "State Bank of India",
              "Axis Bank",
              "Kotak Mahindra",
              "Punjab National Bank",
              "Bank of Baroda",
              "Union Bank",
            ].map((bank) => (
              <div
                key={bank}
                className="text-xs text-muted-foreground p-2 rounded border bg-muted/30"
              >
                {bank}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            We support CSV, PDF, and Excel formats from all major Indian banks.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
