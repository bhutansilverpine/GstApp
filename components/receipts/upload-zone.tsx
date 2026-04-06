"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FileWithPreview extends File {
  preview?: string
  id: string
  status?: "uploading" | "processing" | "complete" | "error"
  progress?: number
}

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
}

export function UploadZone({
  onUpload,
  accept = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: UploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const filesWithPreview = acceptedFiles.map((file) => ({
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        status: "uploading" as const,
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...filesWithPreview])

      // Simulate upload progress
      for (const file of filesWithPreview) {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress, status: "uploading" } : f
            )
          )
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "processing" as const } : f
          )
        )
      }

      try {
        await onUpload(acceptedFiles)

        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "complete" as const, progress: 100 }))
        )
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "error" as const }))
        )
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-all cursor-pointer",
          isDragActive || isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      >
        <input {...getInputProps()} />
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div
            className={cn(
              "mb-4 rounded-full p-4 transition-colors",
              isDragActive || isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            <Upload className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">
              {isDragActive ? "Drop your files here" : "Upload receipt files"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Drag and drop PDF receipts or images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: 10MB. Supports: PDF, JPG, PNG
            </p>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Uploading Files</h4>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={cn(
                      "rounded-full p-2",
                      file.status === "complete"
                        ? "bg-green-500/10 text-green-500"
                        : file.status === "error"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {file.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : file.status === "error" ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.status === "uploading" && file.progress !== undefined && (
                      <Progress value={file.progress} className="h-1 mt-2" />
                    )}
                    {file.status === "processing" && (
                      <p className="text-xs text-muted-foreground">
                        Processing with AI...
                      </p>
                    )}
                    {file.status === "complete" && (
                      <p className="text-xs text-green-500">Upload complete</p>
                    )}
                    {file.status === "error" && (
                      <p className="text-xs text-red-500">Upload failed</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
