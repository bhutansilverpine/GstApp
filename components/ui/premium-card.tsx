"use client"

import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card-content"
import { cn } from "@/lib/utils"

interface PremiumCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "premium" | "glass"
  hover?: boolean
  clickable?: boolean
  onClick?: () => void
}

export function PremiumCard({
  children,
  className,
  variant = "premium",
  hover = true,
  clickable = false,
  onClick,
}: PremiumCardProps) {
  const cardStyles = {
    default: "card-clerk",
    premium: "card-clerk-premium",
    glass: "glass-card-premium",
  }

  return (
    <Card
      className={cn(
        cardStyles[variant],
        hover && hover && "hover-lift cursor-pointer transition-all duration-200",
        clickable && "active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  )
}
