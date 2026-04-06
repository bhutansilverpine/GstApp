"use client"

import { useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Account {
  id: string
  name: string
  code?: string
  type: "asset" | "liability" | "equity" | "revenue" | "expense"
  parentId?: string
  balance?: number
  children?: Account[]
}

interface AccountSelectProps {
  accounts: Account[]
  selectedAccountId?: string
  onSelect: (accountId: string, accountName: string) => void
  placeholder?: string
  className?: string
  showBalance?: boolean
  typeFilter?: Account["type"][]
}

export function AccountSelect({
  accounts,
  selectedAccountId,
  onSelect,
  placeholder = "Select account",
  className,
  showBalance = false,
  typeFilter,
}: AccountSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Build account hierarchy
  const buildAccountTree = (parentId?: string): Account[] => {
    return accounts
      .filter((account) => {
        const matchesParent = account.parentId === parentId
        const matchesType = !typeFilter || typeFilter.includes(account.type)
        return matchesParent && matchesType
      })
      .map((account) => ({
        ...account,
        children: buildAccountTree(account.id),
      }))
  }

  const accountTree = buildAccountTree()

  // Flatten tree for search
  const flattenAccounts = (tree: any[]): Account[] => {
    const result: Account[] = []
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        result.push(node)
        if (node.children) {
          traverse(node.children)
        }
      })
    }
    traverse(tree)
    return result
  }

  // Filter accounts based on search
  const filterAccounts = (accounts: Account[], query: string): Account[] => {
    if (!query.trim()) return accounts

    return accounts
      .map((account) => ({
        ...account,
        children: account.children
          ? filterAccounts(account.children, query)
          : undefined,
      }))
      .filter(
        (account) =>
          account.name.toLowerCase().includes(query.toLowerCase()) ||
          account.code?.toLowerCase().includes(query.toLowerCase()) ||
          (account.children && account.children.length > 0)
      )
  }

  const filteredAccounts = filterAccounts(accountTree, searchQuery)

  const getAccountTypeColor = (type: Account["type"]) => {
    const colors = {
      asset: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      liability: "bg-red-500/10 text-red-500 border-red-500/20",
      equity: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      revenue: "bg-green-500/10 text-green-500 border-green-500/20",
      expense: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    }
    return colors[type]
  }

  const getAccountTypeLabel = (type: Account["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  const renderAccountNode = (account: any, depth = 0) => {
    if (!account) return null

    const hasChildren = account.children && account.children.length > 0
    const isSelected = selectedAccountId === account.id

    return (
      <div key={account.id}>
        <button
          onClick={() => {
            onSelect(account.id, account.name)
            setOpen(false)
            setSearchQuery("")
          }}
          className={cn(
            "w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left",
            isSelected && "bg-primary/10 hover:bg-primary/15"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isSelected && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{account.name}</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs flex-shrink-0", getAccountTypeColor(account.type))}
                >
                  {getAccountTypeLabel(account.type)}
                </Badge>
              </div>
              {account.code && (
                <p className="text-xs text-muted-foreground">
                  {account.code}
                </p>
              )}
            </div>
          </div>
          {showBalance && account.balance !== undefined && (
            <span className="text-sm font-medium ml-2">
              ₹{account.balance.toFixed(2)}
            </span>
          )}
        </button>

        {hasChildren && (
          <div className="ml-2">
            {account.children.map((child: any) =>
              renderAccountNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedAccount && "text-muted-foreground",
            className
          )}
        >
          {selectedAccount ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="truncate">{selectedAccount.name}</span>
              {selectedAccount.code && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {selectedAccount.code}
                </Badge>
              )}
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {filteredAccounts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No accounts found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAccounts.map((account) => renderAccountNode(account))}
              </div>
            )}
          </div>
        </ScrollArea>

        {typeFilter && typeFilter.length > 0 && (
          <div className="p-2 border-t bg-muted/50">
            <div className="flex flex-wrap gap-1">
              {typeFilter.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn("text-xs", getAccountTypeColor(type))}
                >
                  {getAccountTypeLabel(type)}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground px-2">
                filtered
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
