// Export all premium Clerk-inspired components
export { PremiumButton } from './premium-button'
export { PremiumCard } from './premium-card'
export { PremiumGlassCard } from './premium-glass-card'
export { PremiumInput } from './premium-input'
export { PremiumDropdown } from './premium-dropdown'
export { PremiumHeader } from './dashboard/premium-header'
export { PremiumMetricCard } from './dashboard/premium-metric-card'

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
  "hover-lift": "hover-lift",
  "card-clerk": "card-clerk-premium",
  "glass-card-premium": "glass-card-premium",
  "button-premium-primary": "button-premium-primary",
  "button-premium-secondary": "button-premium-secondary",
  "button-clerk-ghost": "button-clerk-ghost",
  "input-clerk": "input-clerk",
  "badge-premium": "badge-premium",
  "dropdown-clerk": "dropdown-clerk",
} as const
}

// Clerk-inspired color utilities
export const clerkColors = {
  primary: '#6366f1', // Clerk indigo blue
  primaryDark: '#4f46e5',
  accent: '#22c55e', // Green accent
  slate: '#64748b', // Slate gray
  gray: '#6b7280', // Neutral gray
  zinc: '#71717a', // Zinc gray
}