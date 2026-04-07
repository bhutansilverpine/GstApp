// Export all premium Clerk-inspired UI components and utilities
export { PremiumButton } from './premium-button'
export { PremiumCard } from './premium-card'
export { PremiumGlassCard } from '../dashboard/premium-glass-card'
export { PremiumInput } from './premium-input'
export { PremiumDropdown } from './premium-dropdown'
export { MetricCard as PremiumMetricCard } from '../dashboard/premium-metric-card'

// Export all skeleton loading components
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

// Export loading overlay
export { LoadingOverlay } from './premium-loading'

// Export utility classes
export { cn } from '@/lib/utils'

// Export animations
export const animations = {
  "fade-in-up": "animate-fade-in",
  "scale-in": "animate-scale-in",
  "slide-in": "animate-slide-in",
  "shimmer": "animate-shimmer",
  "shimmer-clerk": "animate-shimmer-clerk",
  "pulse-clerk": "animate-pulse-clerk",
  "hover-lift": "hover-lift",
  "card-clerk": "card-clerk-premium",
  "glass-card-premium": "glass-card-premium",
  "button-premium-primary": "button-premium-primary",
  "button-premium-secondary": "button-premium-secondary",
  "button-clerk-ghost": "button-clerk-ghost",
  "input-clerk": "input-clerk",
  "badge-premium": "badge-premium",
  "dropdown-clerk": "dropdown-clerk",
  "loading-overlay": "loading-overlay",
} as const

// Export color utilities for Clerk.com matching
export const clerkColors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  accent: '#22c55e',
  accentLight: '#34d399',
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
}