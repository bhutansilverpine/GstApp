# Silverpine Ledger - Premium UI Components

A comprehensive collection of premium UI components for the Silverpine Ledger SaaS application, inspired by Clerk.com and Supabase.com design patterns.

## Design Philosophy

- **Clean & Minimalist**: Following Clerk.com's aesthetic with subtle shadows and smooth transitions
- **Supabase-style Navigation**: Collapsible sidebar with intuitive navigation patterns
- **Indigo Color Scheme**: Using the primary indigo color palette from Tailwind config
- **Glassmorphism Effects**: Modern glass-effect cards with backdrop blur
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Accessibility**: Focus states, ARIA labels, and keyboard navigation support

## Component Structure

```
components/
├── ui/                    # Core UI components (Radix UI primitives)
│   ├── button.tsx         # Custom button with variants
│   ├── card.tsx          # Card components with Header, Content, Footer
│   ├── input.tsx         # Form input with focus states
│   ├── label.tsx         # Form labels
│   ├── dropdown-menu.tsx # Dropdown menu component
│   ├── dialog.tsx        # Modal/dialog component
│   ├── toast.tsx         # Toast notifications
│   ├── select.tsx        # Select component
│   ├── separator.tsx     # Visual separator
│   ├── tabs.tsx          # Tab navigation
│   ├── badge.tsx         # Badge/status indicators
│   ├── avatar.tsx        # User avatar
│   ├── table.tsx         # Table components
│   ├── progress.tsx      # Progress bars
│   ├── textarea.tsx      # Text area input
│   └── index.ts          # Component exports
│
├── dashboard/            # Dashboard-specific components
│   ├── sidebar.tsx       # Supabase-style collapsible sidebar
│   ├── header.tsx        # Dashboard header with org switcher
│   ├── metric-card.tsx   # Metric cards with trends
│   ├── breadcrumb.tsx    # Breadcrumb navigation
│   ├── glass-card.tsx    # Glassmorphism card component
│   └── index.ts          # Component exports
│
└── auth/                 # Authentication components
    ├── org-switcher.tsx  # Organization switcher
    ├── user-menu.tsx     # User dropdown menu
    └── index.ts          # Component exports
```

## Core UI Components

### Button
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Input & Label
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>
```

### Select
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Dialog
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content goes here</p>
  </DialogContent>
</Dialog>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Destructive</Badge>
```

### Table
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Dashboard Components

### Sidebar
```tsx
import { Sidebar } from "@/components/dashboard/sidebar"

// In dashboard layout
<Sidebar />
```

Features:
- Collapsible navigation
- Active route highlighting
- Badge indicators for notifications
- Smooth collapse/expand animations
- Responsive mobile support

### Dashboard Header
```tsx
import { DashboardHeader } from "@/components/dashboard/header"

<DashboardHeader
  title="Dashboard"
  subtitle="Welcome back, John"
/>
```

Features:
- Organization switcher
- User menu dropdown
- Notifications with badge
- Search functionality
- Breadcrumb integration

### Metric Card
```tsx
import { MetricCard } from "@/components/dashboard/metric-card"

<MetricCard
  title="Total Revenue"
  value="₹45,231.89"
  change={20.1}
  changeType="increase"
  trend="up"
  icon={<DollarSign className="h-4 w-4" />}
  description="From last month"
/>
```

### Glass Card
```tsx
import { GlassCard } from "@/components/dashboard/glass-card"

<GlassCard
  title="Analytics"
  description="Revenue overview"
>
  <ChartComponent />
</GlassCard>
```

Features:
- Glassmorphism effect
- Gradient background option
- Hover animations
- Backdrop blur

### Breadcrumb
```tsx
import { Breadcrumb } from "@/components/dashboard/breadcrumb"

<Breadcrumb
  items={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Invoices", href: "/dashboard/invoices" },
    { label: "Create Invoice" }
  ]}
/>
```

## Authentication Components

### Organization Switcher
```tsx
import { OrganizationSwitcher } from "@/components/auth/org-switcher"

<OrganizationSwitcher />
```

Features:
- Multiple organization support
- Quick organization switching
- Create new organization option
- Role display

### User Menu
```tsx
import { UserMenu } from "@/components/auth/user-menu"

<UserMenu />
```

Features:
- Profile management
- Settings access
- Billing information
- Keyboard shortcuts
- Logout functionality

## App Structure

### Pages
- `/` - Landing page with hero, features, and CTA
- `/sign-in` - Clerk authentication page
- `/sign-up` - Clerk registration page
- `/dashboard` - Main dashboard with metrics and charts
- `/components-showcase` - Complete component showcase

### Layouts
- `app/layout.tsx` - Root layout with Clerk provider
- `app/dashboard/layout.tsx` - Dashboard layout with sidebar and header

## Usage Examples

### Creating a New Dashboard Page
```tsx
import { DashboardHeader } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { GlassCard } from "@/components/dashboard/glass-card"

export default function NewPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="New Page"
        subtitle="Page description"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Metric 1"
          value="123"
          change={10}
          trend="up"
        />
      </div>
      <GlassCard title="Content">
        Your content here
      </GlassCard>
    </div>
  )
}
```

### Using Toast Notifications
```tsx
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

function MyComponent() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success",
          description: "Operation completed successfully",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

## Styling Guidelines

### Color Usage
- **Primary**: Use for main actions, links, and important elements
- **Secondary**: Use for secondary actions and less important elements
- **Destructive**: Use for dangerous actions (delete, remove)
- **Muted**: Use for less important text and disabled states
- **Accent**: Use for hover states and interactive elements

### Spacing
- Use `space-y-*` and `space-x-*` for consistent spacing
- Use `gap-*` in flex and grid layouts
- Maintain consistent padding: `p-4` (cards), `p-6` (sections)

### Typography
- **Heading 1**: `text-4xl font-bold` (page titles)
- **Heading 2**: `text-2xl font-semibold` (section titles)
- **Heading 3**: `text-lg font-semibold` (card titles)
- **Body**: `text-sm` or `text-base` for content
- **Muted**: `text-sm text-muted-foreground` for descriptions

## Best Practices

1. **Always use semantic HTML** - proper heading hierarchy, button types, etc.
2. **Provide focus states** - all interactive elements should have visible focus states
3. **Use proper labels** - form inputs should have associated labels
4. **Maintain consistency** - use the same components and patterns throughout
5. **Responsive design** - test on mobile, tablet, and desktop
6. **Accessibility** - use ARIA labels, alt text, and keyboard navigation
7. **Performance** - use React.memo() and useCallback() where appropriate

## Component Variants

Most components support multiple variants:
- **default**: Primary style
- **outline**: Bordered style
- **ghost**: Minimal style, hover background only
- **destructive**: Error/danger style
- **secondary**: Secondary color style

## Dependencies

- `@radix-ui/*`: Headless UI primitives
- `class-variance-authority`: Component variant management
- `tailwind-merge`: Intelligent Tailwind class merging
- `clsx`: Conditional className utility
- `lucide-react`: Icon library

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use these components in your projects.
