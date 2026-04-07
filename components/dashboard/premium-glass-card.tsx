"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PremiumGlassCardProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  variant?: "default" | "premium" | "glass"
}

export function PremiumGlassCard({
  children,
  title,
  description,
  icon,
  actions,
  variant = "glass",
  className,
}: PremiumGlassCardProps) {
  const cardStyles = {
    default: "card-clerk",
    premium: "card-clerk-premium",
    glass: "glass-card-premium",
  }

  return (
    <Card className={cn(cardStyles[variant], "animate-in-up", className)}>
      {(title || icon || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
              {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </CardHeader>
      )}
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}
