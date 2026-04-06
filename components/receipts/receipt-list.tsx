"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  FileText,
  Calendar,
  IndianRupee,
  Building2,
  Eye,
  Download,
  Trash2,
  BadgeCheck,
  AlertTriangle,
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
import { cn, formatCurrency } from "@/lib/utils"

interface Receipt {
  id: string
  fileName: string
  amount: number
  date: string
  vendor: string
  hasTPN: boolean
  gstAmount: number
  category: string
  status: "verified" | "flagged" | "processed"
}

interface ReceiptListProps {
  receipts: Receipt[]
  onView?: (receipt: Receipt) => void
  onDownload?: (receipt: Receipt) => void
  onDelete?: (id: string) => void
}

export function ReceiptList({
  receipts,
  onView,
  onDownload,
  onDelete,
}: ReceiptListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tpnFilter, setTpnFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "vendor">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredAndSortedReceipts = receipts
    .filter((receipt) => {
      // Search filter
      const matchesSearch =
        receipt.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.vendor.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter === "all" || receipt.status === statusFilter

      // TPN filter
      const matchesTPN =
        tpnFilter === "all" ||
        (tpnFilter === "with-tpn" && receipt.hasTPN) ||
        (tpnFilter === "without-tpn" && !receipt.hasTPN)

      return matchesSearch && matchesStatus && matchesTPN
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison =
          new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount
      } else if (sortBy === "vendor") {
        comparison = a.vendor.localeCompare(b.vendor)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  const toggleSort = (column: "date" | "amount" | "vendor") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor or file name..."
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
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tpnFilter} onValueChange={setTpnFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by TPN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Receipts</SelectItem>
                <SelectItem value="with-tpn">With TPN</SelectItem>
                <SelectItem value="without-tpn">Without TPN</SelectItem>
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
                  By Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("amount")}>
                  By Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("vendor")}>
                  By Vendor {sortBy === "vendor" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedReceipts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No receipts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || tpnFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Upload your first receipt to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
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
                    <TableHead>Vendor</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Amount
                        {sortBy === "amount" && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>TPN Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{receipt.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {receipt.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(receipt.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {receipt.vendor}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            receipt.hasTPN ? "text-green-500" : "text-muted-foreground"
                          )}
                        >
                          {formatCurrency(receipt.gstAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {receipt.hasTPN ? (
                          <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20">
                            <BadgeCheck className="h-3 w-3" />
                            With TPN
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            No TPN
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            receipt.status === "verified"
                              ? "default"
                              : receipt.status === "processed"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {receipt.status}
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
                                onClick={() => onView?.(receipt)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDownload?.(receipt)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete?.(receipt.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">
                  {filteredAndSortedReceipts.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    filteredAndSortedReceipts.reduce(
                      (sum, r) => sum + r.amount,
                      0
                    )
                  )}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GST Claimable</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(
                    filteredAndSortedReceipts
                      .filter((r) => r.hasTPN)
                      .reduce((sum, r) => sum + r.gstAmount, 0)
                  )}
                </p>
              </div>
              <BadgeCheck className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With TPN</p>
                <p className="text-2xl font-bold">
                  {
                    filteredAndSortedReceipts.filter((r) => r.hasTPN)
                      .length
                  }
                </p>
              </div>
              <BadgeCheck className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
