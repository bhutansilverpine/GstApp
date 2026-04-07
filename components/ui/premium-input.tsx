"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
  containerClassName?: string
  inputClassName?: string
}

export function PremiumInput({
  label,
  error,
  helper,
  icon,
  showPasswordToggle,
  containerClassName,
  inputClassName,
  type = "text",
  ...props
}: PremiumInputProps) {
  const [showPassword, setShowPassword] = showPasswordToggle ? useState(false) : [false, () => false]

  const togglePassword = () => setShowPassword(!showPassword)

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <Input
          type={showPassword ? (showPassword ? "text" : "password") : type}
          className={cn(
            "input-clerk",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500/20",
            inputClassName
          )}
          {...props}
        />
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helper}</p>
      )}
    </div>
  )
}
