"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  IndianRupee,
  Calendar,
  Tag,
  MoreVertical,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryBadge } from "./category-badge"
import { cn, formatCurrency } from "@/lib/utils"

export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "debit" | "credit"
  balance: number
  category?: string
  status: "uncategorized" | "categorized" | "reconciled"
  reference?: string
}

interface TransactionListProps {
  transactions: BankTransaction[]
  onCategorize?: (transactionId: string, category: string) => void
  onViewDetails?: (transaction: BankTransaction) => void
  onExport?: () => void
}

export function TransactionList({
  transactions,
  onCategorize,
  onViewDetails,
  onExport,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Get unique categories
  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean))
  )

  const filteredAndSortedTransactions = transactions
    .filter((transaction) => {
      // Search filter
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter

      // Status filter
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || transaction.category === categoryFilter

      return matchesSearch && matchesType && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison =
          new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount
      } else if (sortBy === "description") {
        comparison = a.description.localeCompare(b.description)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  const toggleSort = (column: "date" | "amount" | "description") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const totalDebits = filteredAndSortedTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalCredits = filteredAndSortedTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0)

  const uncategorizedCount = filteredAndSortedTransactions.filter(
    (t) => t.status === "uncategorized"
  ).length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debit">Debits</SelectItem>
                <SelectItem value="credit">Credits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                <SelectItem value="categorized">Categorized</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {onExport && (
              <Button variant="outline" onClick={onExport} className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">
                  {filteredAndSortedTransactions.length}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(totalCredits)}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(totalDebits)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uncategorized</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {uncategorizedCount}
                </p>
              </div>
              <Tag className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Upload a bank statement to see transactions"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                        {sortBy === "date" && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              sortOrder === "asc" && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Amount
                        {sortBy === "amount" && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              sortOrder === "asc" && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={cn(
                        transaction.status === "uncategorized" && "bg-yellow-500/5"
                      )}
                    >
                      <TableCell className="whitespace-nowrap">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.reference && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {transaction.reference}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === "debit" ? (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                          )}
                          <span
                            className={cn(
                              "font-medium",
                              transaction.type === "debit"
                                ? "text-red-500"
                                : "text-green-500"
                            )}
                          >
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.balance)}
                      </TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <CategoryBadge category={transaction.category} />
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Tag className="h-3 w-3 mr-1" />
                            Uncategorized
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "reconciled"
                              ? "default"
                              : transaction.status === "categorized"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onViewDetails?.(transaction)}
                              >
                                View Details
                              </DropdownMenuItem>
                              {onCategorize && transaction.status !== "reconciled" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    // In a real app, this would open a category picker
                                    const category = prompt("Enter category:")
                                    if (category) {
                                      onCategorize(transaction.id, category)
                                    }
                                  }}
                                >
                                  Categorize
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
