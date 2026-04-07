// Export all premium Clerk-inspired components
export { PremiumButton } from './premium-button'
export { PremiumCard } from './premium-card'
export { PremiumGlassCard } from './premium-glass-card'
export { PremiumInput } from './premium-input'
export { PremiumDropdown } from './premium-dropdown'
export { PremiumMetricCard } from './dashboard/premium-metric-card'
export { PremiumHeader } from './dashboard/premium-header'

// Re-export skeleton components
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonTable,
  Shimmer,
  SkeletonButton,
  SkeletonInput,
  SkeletonBadge,
} from './premium-skeleton'

// Utility classes for Clerk-like styling
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx("cn", ...classes))
}

// Clerk-inspired animation utilities
export const animations = {
  "fade-in-up": "animate-fade-in",
  "scale-in": "animate-scale-in",
  "slide-in": "animate-slide-in",
  "shimmer": "animate-shimmer",
  "pulse-soft": "animate-pulse-clerk",
  "hover-lift": "hover:shadow-xl hover:-translate-y-1",
  "card-clerk": "card-clerk-premium",
  "glass-card-premium": "glass-card-premium",
} as const
}