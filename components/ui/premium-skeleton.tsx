"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton-clerk animate-pulse", className)} />
}

export function SkeletonText({ className }: SkeletonProps) {
  return <div className={cn("skeleton-text skeleton-clerk", className)} />
}

export function SkeletonCircle({ className, size = "md" }: SkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return <div className={cn("skeleton-circle skeleton-clerk", sizeClasses[size], className)} />
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 3, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Shimmer({ className }: SkeletonProps) {
  return <div className={cn("shimmer-clerk rounded-lg", className)} />
}

export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <div className={cn("h-10 w-24 rounded-lg button-premium-primary", className)} />
  )
}

export function SkeletonInput({ className }: SkeletonProps) {
  return (
    <div className={cn("h-10 w-full rounded-xl input-clerk", className)} />
  )
}

export function SkeletonBadge({ className }: SkeletonProps) {
  return (
    <div className={cn("h-6 w-16 rounded-full badge-premium", className)} />
  )
}
