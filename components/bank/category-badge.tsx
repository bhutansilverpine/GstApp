"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Building2,
  ShoppingBag,
  Utensils,
  Car,
  Plane,
  Briefcase,
  Home,
  HeartPulse,
  GraduationCap,
  Smartphone,
  Zap,
  MoreHorizontal,
} from "lucide-react"

interface CategoryBadgeProps {
  category: string
  className?: string
}

const categoryConfig: Record<
  string,
  { icon: any; color: string; bgClass: string; textClass: string }
> = {
  "Office Supplies": {
    icon: Building2,
    color: "blue",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
  },
  "Travel": {
    icon: Plane,
    color: "purple",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
  },
  "Meals & Entertainment": {
    icon: Utensils,
    color: "orange",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-500",
  },
  "Vehicle Expenses": {
    icon: Car,
    color: "red",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
  },
  "Professional Services": {
    icon: Briefcase,
    color: "indigo",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-500",
  },
  "Rent & Utilities": {
    icon: Home,
    color: "green",
    bgClass: "bg-green-500/10",
    textClass: "text-green-500",
  },
  "Healthcare": {
    icon: HeartPulse,
    color: "pink",
    bgClass: "bg-pink-500/10",
    textClass: "text-pink-500",
  },
  "Education": {
    icon: GraduationCap,
    color: "cyan",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-500",
  },
  "Technology": {
    icon: Smartphone,
    color: "violet",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-500",
  },
  "Utilities": {
    icon: Zap,
    color: "yellow",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-500",
  },
  "Shopping": {
    icon: ShoppingBag,
    color: "emerald",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
  },
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] || {
    icon: MoreHorizontal,
    color: "gray",
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-500",
  }

  const Icon = config.icon

  return (
    <Badge
      className={cn(
        "gap-1.5 border-0 font-normal",
        config.bgClass,
        config.textClass,
        className
      )}
      variant="outline"
    >
      <Icon className="h-3 w-3" />
      {category}
    </Badge>
  )
}
