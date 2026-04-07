"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  show?: boolean
  message?: string
  variant?: "default" | "full" | "minimal"
}

export function LoadingOverlay({
  show = true,
  message = "Loading...",
  variant = "default",
}: LoadingOverlayProps) {
  if (!show) return null

  const overlayStyles = {
    default: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
    full: "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md",
    minimal: "bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm",
  }

  const contentStyles = {
    default: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
    full: "fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-800",
    minimal: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
  }

  const loaderSizes = {
    default: "h-12 w-12",
    full: "h-16 w-16",
    minimal: "h-8 w-8",
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        overlayStyles[variant],
        "animate-fade-in"
      )}
    >
      <div className="space-y-4 text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className={cn(loaderSizes[variant], "text-primary animate-spin")} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {message}
          </p>
          {variant !== "minimal" && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please wait...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
