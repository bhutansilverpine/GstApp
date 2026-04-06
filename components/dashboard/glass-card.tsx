import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function GlassCard({
  title,
  description,
  children,
  className,
  gradient = false,
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden backdrop-blur-sm transition-all hover:shadow-xl",
        gradient
          ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
          : "bg-background/80 backdrop-blur-md border-border/50",
        className
      )}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: ReactNode
  trend?: "up" | "down"
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn("hover:scale-105 transition-transform duration-200", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                "text-xs mt-1",
                trend === "up" ? "text-green-500" : "text-red-500"
              )}
            >
              {trend === "up" ? "+" : "-"}
              {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
