"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency } from "@/lib/utils"

export interface Transaction {
  id: string
  date: string
  description: string
  journalEntry: string
  lines: {
    account: string
    debit: number
    credit: number
  }[]
  totalDebit: number
  totalCredit: number
  status: "posted" | "draft" | "reversed"
  createdBy: string
  createdAt: string
}

interface TransactionListProps {
  transactions: Transaction[]
  onView?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  onReverse?: (id: string) => void
}

export function TransactionList({
  transactions,
  onView,
  onEdit,
  onDelete,
  onReverse,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const filteredAndSortedTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.journalEntry.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "amount") {
        comparison = a.totalDebit - b.totalDebit
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

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const totalTransactions = filteredAndSortedTransactions.length
  const totalValue = filteredAndSortedTransactions.reduce(
    (sum, t) => sum + t.totalDebit,
    0
  )

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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleSort("date")}>
                  By Date{" "}
                  {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("amount")}>
                  By Amount{" "}
                  {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("description")}>
                  By Description{" "}
                  {sortBy === "description" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posted This Month</p>
                <p className="text-2xl font-bold">
                  {
                    filteredAndSortedTransactions.filter(
                      (t) => t.status === "posted"
                    ).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first journal entry to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                        {sortBy === "date" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Journal Entry</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort("description")}
                    >
                      <div className="flex items-center gap-2">
                        Description
                        {sortBy === "description" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Total Debit</TableHead>
                    <TableHead className="text-right">Total Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((transaction) => (
                    <>
                      <TableRow key={transaction.id}>
                        <TableCell className="w-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRowExpand(transaction.id)}
                            className="h-8 w-8"
                          >
                            {expandedRows.has(transaction.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.journalEntry}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.totalCredit)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "posted"
                                ? "default"
                                : transaction.status === "draft"
                                ? "secondary"
                                : "destructive"
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
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onView?.(transaction)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {transaction.status !== "posted" && (
                                  <DropdownMenuItem
                                    onClick={() => onEdit?.(transaction)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {transaction.status === "posted" && onReverse && (
                                  <DropdownMenuItem
                                    onClick={() => onReverse(transaction.id)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Reverse Entry
                                  </DropdownMenuItem>
                                )}
                                {transaction.status !== "posted" && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete?.(transaction.id)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      {expandedRows.has(transaction.id) && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/50">
                            <div className="py-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Created by:
                                  </span>{" "}
                                  {transaction.createdBy}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Created at:
                                  </span>{" "}
                                  {new Date(transaction.createdAt).toLocaleString()}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold mb-2">
                                  Entry Lines
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="grid grid-cols-3 gap-4 p-2 bg-muted/50 text-sm font-medium">
                                    <div>Account</div>
                                    <div className="text-right">Debit</div>
                                    <div className="text-right">Credit</div>
                                  </div>
                                  {transaction.lines.map((line, index) => (
                                    <div
                                      key={index}
                                      className="grid grid-cols-3 gap-4 p-2 border-t text-sm"
                                    >
                                      <div>{line.account}</div>
                                      <div className="text-right">
                                        {line.debit > 0
                                          ? formatCurrency(line.debit)
                                          : "-"}
                                      </div>
                                      <div className="text-right">
                                        {line.credit > 0
                                          ? formatCurrency(line.credit)
                                          : "-"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
