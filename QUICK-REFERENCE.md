# 🚀 Silverpine Ledger - Quick Reference Guide

## 📦 Component Import Guide

### UI Components
```tsx
import {
  // Form Components
  Button, Input, Label, Textarea, Select,
  // Layout
  Card, Dialog, Tabs, Separator,
  // Feedback
  Alert, Toast, Progress, Skeleton,
  // Data Display
  Table, Badge, Avatar,
  // Navigation
  DropdownMenu
} from "@/components/ui"
```

### Dashboard Components
```tsx
import {
  Sidebar,
  DashboardHeader,
  MetricCard,
  GlassCard,
  Breadcrumb
} from "@/components/dashboard"
```

### Auth Components
```tsx
import {
  OrganizationSwitcher,
  UserMenu
} from "@/components/auth"
```

---

## 🎨 Component Quick Start

### Button Variants
```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Badge Variants
```tsx
<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Alert Variants
```tsx
<Alert variant="default">Info</Alert>
<Alert variant="destructive">Error</Alert>
<Alert variant="warning">Warning</Alert>
<Alert variant="success">Success</Alert>
<Alert variant="info">Info</Alert>
```

---

## 📊 Dashboard Patterns

### Metric Card
```tsx
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
<GlassCard
  title="Analytics"
  description="Revenue overview"
  gradient
>
  <YourContent />
</GlassCard>
```

### Breadcrumb
```tsx
<Breadcrumb
  items={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Invoices", href: "/dashboard/invoices" },
    { label: "Create" }
  ]}
/>
```

---

## 🔐 Authentication Patterns

### Organization Switcher
```tsx
<OrganizationSwitcher />
```

### User Menu
```tsx
<UserMenu />
```

---

## 🎯 Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast"

function Component() {
  const { toast } = useToast()

  const handleClick = () => {
    toast({
      title: "Success!",
      description: "Operation completed successfully",
    })
  }

  return <Button onClick={handleClick}>Show Toast</Button>
}
```

---

## 📱 Responsive Breakpoints

- `sm:` - 640px (mobile landscape)
- `md:` - 768px (tablet)
- `lg:` - 1024px (laptop)
- `xl:` - 1280px (desktop)
- `2xl:` - 1536px (large screens)

---

## 🎨 Color Palette

### Primary (Indigo)
- `bg-primary` - Main primary color
- `text-primary-foreground` - Text on primary
- `hover:bg-primary/90` - Hover state

### Semantic Colors
- `bg-destructive` - Error/danger
- `bg-muted` - Disabled/secondary
- `bg-accent` - Hover/active
- `border-border` - Borders

---

## ♿ Accessibility Quick Tips

1. **Always provide labels** for form inputs
2. **Use semantic HTML** (button, not div)
3. **Add aria-labels** for icon-only buttons
4. **Ensure keyboard navigation** works
5. **Provide focus indicators** for interactive elements
6. **Use proper heading hierarchy**

---

## 🚀 Common Patterns

### Card with Header
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Form Field
```tsx
<div className="grid gap-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" placeholder="Enter value" />
</div>
```

### Table Row
```tsx
<TableRow>
  <TableCell className="font-medium">Data</TableCell>
  <TableCell>More data</TableCell>
  <TableCell className="text-right">
    <Badge variant="success">Active</Badge>
  </TableCell>
</TableRow>
```

---

## 📝 File Locations

```
components/
├── ui/              # Core components
├── dashboard/       # Dashboard components
└── auth/           # Auth components

app/
├── page.tsx        # Landing page
├── layout.tsx      # Root layout
├── dashboard/      # Dashboard pages
└── sign-in/        # Auth pages

hooks/
└── use-toast.ts    # Toast hook
```

---

## 🎯 Best Practices

1. **Import from index files** - Use `@/components/ui`
2. **Use semantic variants** - `variant="destructive"` for delete actions
3. **Provide descriptions** - Help screen readers
4. **Test responsive** - Check mobile view
5. **Consistent spacing** - Use `gap-4`, `p-6` patterns
6. **Proper nesting** - Card > CardHeader > CardTitle

---

## 🐛 Troubleshooting

### Component not found?
- Check import path
- Ensure component is exported in `index.ts`
- Verify file exists in correct directory

### Styles not working?
- Check Tailwind classes
- Verify `globals.css` is imported
- Check for conflicting classes

### TypeScript errors?
- Check prop types
- Verify import types
- Ensure all dependencies are installed

---

## 📚 Documentation Links

- **Full Component Guide**: `COMPONENTS.md`
- **Implementation Details**: `SETUP-SUMMARY.md`
- **Completion Report**: `IMPLEMENTATION-COMPLETE.md`
- **Component Showcase**: `/components-showcase`

---

## ✅ Component Checklist

### UI Components (18)
- [x] Button (6 variants)
- [x] Card (5 sub-components)
- [x] Input
- [x] Label
- [x] Textarea
- [x] Select
- [x] Dialog
- [x] Tabs
- [x] Alert (5 variants)
- [x] Toast
- [x] Progress
- [x] Skeleton
- [x] Table (7 sub-components)
- [x] Badge (6 variants)
- [x] Avatar
- [x] Dropdown Menu
- [x] Separator

### Dashboard Components (6)
- [x] Sidebar
- [x] Header
- [x] Metric Card
- [x] Glass Card
- [x] Breadcrumb
- [x] Stat Card

### Auth Components (2)
- [x] Organization Switcher
- [x] User Menu

---

**Total: 25+ Production-Ready Components ✅**

---

*Last Updated: April 6, 2026*
*Version: 1.0.0*
*Status: Production Ready*
