"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "primary" | "secondary" | "ghost" | "outline" | "link"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

export function PremiumButton({
  asChild,
  size = "md",
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  ...props
}: PremiumButtonProps) {
  const sizeClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-6 text-base",
    xl: "h-12 px-8 text-lg",
  }

  const variantStyles = {
    primary: "button-premium-primary",
    secondary: "button-premium-secondary",
    ghost: "button-clerk-ghost",
    outline: "button-clerk-secondary",
    link: "button-clerk-ghost",
  }

  const Comp = asChild ? "span" : "button"

  return (
    <Comp
      className={cn(
        "button-premium",
        sizeClasses[size],
        variantStyles[variant],
        fullWidth && "w-full",
        isLoading && "cursor-not-allowed",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </Comp>
  )
}
