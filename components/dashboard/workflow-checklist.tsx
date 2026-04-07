"use client"

import { CheckCircle2, Circle, Building2, Settings, FileText, Upload, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WorkflowItem {
  id: string
  title: string
  description: string
  completed: boolean
  category: "setup" | "finance" | "import" | "automation" | "compliance"
  action?: string
}

interface WorkflowChecklistProps {
  className?: string
}

const workflowItems: WorkflowItem[] = [
  // Organization Setup
  {
    id: "org-info",
    title: "Business information configured",
    description: "Add your business name, address, and contact details",
    completed: false,
    category: "setup",
    action: "/dashboard/settings",
  },
  {
    id: "org-tpn",
    title: "TPN added and verified",
    description: "Add your Tax Payer Number for GST compliance",
    completed: false,
    category: "setup",
    action: "/dashboard/settings",
  },

  // Financial Setup
  {
    id: "accounts-reviewed",
    title: "Chart of accounts reviewed",
    description: "Review and customize your account structure",
    completed: false,
    category: "finance",
    action: "/dashboard/transactions",
  },
  {
    id: "tax-configured",
    title: "Tax rates configured (7% GST)",
    description: "Verify GST rate and tax settings",
    completed: true, // Usually pre-configured
    category: "finance",
  },

  // Data Import
  {
    id: "bank-uploaded",
    title: "Bank statements uploaded",
    description: "Import your bank statements for reconciliation",
    completed: false,
    category: "import",
    action: "/dashboard/bank",
  },
  {
    id: "receipts-uploaded",
    title: "Receipts uploaded and verified",
    description: "Upload receipts and verify AI extraction",
    completed: false,
    category: "import",
    action: "/dashboard/receipts",
  },

  // Automation Setup
  {
    id: "auto-reconcile",
    title: "Auto-reconciliation enabled",
    description: "Enable smart matching of bank transactions to receipts",
    completed: false,
    category: "automation",
    action: "/dashboard/reconcile",
  },

  // Compliance Ready
  {
    id: "bit-tested",
    title: "BIT export tested",
    description: "Test Business Income Tax export functionality",
    completed: false,
    category: "compliance",
    action: "/dashboard/bit",
  },
]

const categoryInfo = {
  setup: {
    title: "Organization Setup",
    icon: Building2,
    color: "bg-blue-500",
  },
  finance: {
    title: "Financial Setup",
    icon: Settings,
    color: "bg-green-500",
  },
  import: {
    title: "Data Import",
    icon: Upload,
    color: "bg-purple-500",
  },
  automation: {
    title: "Automation",
    icon: FileText,
    color: "bg-orange-500",
  },
  compliance: {
    title: "Compliance Ready",
    icon: Shield,
    color: "bg-red-500",
  },
}

export function WorkflowChecklist({ className }: WorkflowChecklistProps) {
  // Calculate progress
  const totalItems = workflowItems.length
  const completedItems = workflowItems.filter(item => item.completed).length
  const progress = Math.round((completedItems / totalItems) * 100)

  // Group items by category
  const itemsByCategory = workflowItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, WorkflowItem[]>)

  return (
    <Card className={cn("col-span-3", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Setup Checklist</CardTitle>
          <Badge variant={progress === 100 ? "default" : "secondary"}>
            {completedItems}/{totalItems} Complete
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, items]) => {
            const info = categoryInfo[category as keyof typeof categoryInfo]
            const Icon = info.icon

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded", info.color)}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold">{info.title}</h4>
                </div>

                <div className="space-y-2 pl-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        item.completed
                          ? "bg-green-50 border-green-200 dark:bg-green-950"
                          : "bg-background border-border"
                      )}
                    >
                      <button
                        className={cn(
                          "mt-0.5 flex-shrink-0",
                          item.completed ? "text-green-600" : "text-muted-foreground"
                        )}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-medium",
                            item.completed ? "text-green-900 dark:text-green-100" : "text-foreground"
                          )}>
                            {item.title}
                          </p>
                          {!item.completed && item.action && (
                            <a
                              href={item.action}
                              className="text-xs text-primary hover:underline"
                            >
                              Complete →
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {progress === 100 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                Setup Complete!
              </p>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your Silverpine Ledger is ready to use. Start by uploading receipts and bank statements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}