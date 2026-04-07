"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  valueNumber?: number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  trend?: "up" | "down" | "neutral"
  icon: LucideIcon
  description: string
  className?: string
}

export function MetricCard({
  title,
  value,
  valueNumber,
  change = 0,
  changeType = "neutral",
  trend = "neutral",
  icon: Icon,
  description,
  className,
}: MetricCardProps) {
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: TrendingUp,
  }

  const trendColors = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-500",
  }

  return (
    <Card className={cn(
    "card-clerk-premium hover-lift transition-all duration-200",
    className
  )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {valueNumber !== undefined ? formatCurrency(valueNumber) : value}
          </h3>

          {change !== 0 && (
            <div className="flex items-center gap-1 text-sm font-medium">
              {changeType === "increase" && <TrendingUp className="h-4 w-4 text-green-600" />}
              {changeType === "decrease" && <TrendingDown className="h-4 w-4 text-red-600" />}
              <span className={trendColors[changeType]}>
                {change > 0 ? "+" : ""}{Math.abs(change)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress bar for goals/targets */}
        {changeType === "increase" && (
          <Progress value={75} className="h-2 w-full bg-gray-200 dark:bg-gray-700" />
        )}

        {changeType === "decrease" && (
          <Progress value={25} className="h-2 w-full bg-gray-200 dark:bg-gray-700" />
        )}
      </CardContent>
    </Card>
  )
}
