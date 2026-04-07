"use client"

import { useState } from "react"
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDollarSign,
  Calendar,
  Building2,
  BadgeCheck,
  Edit2,
  Save,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency } from "@/lib/utils"

interface ReceiptField {
  value: string | number
  confidence: number
  isEditable: boolean
}

interface UnverifiedReceipt {
  id: string
  fileName: string
  uploadedAt: string
  fields: {
    amount: ReceiptField
    date: ReceiptField
    vendor: ReceiptField
    tpn: ReceiptField & { hasTPN: boolean }
    gstin: ReceiptField
    gstAmount: ReceiptField
  }
  status: "pending" | "verified" | "rejected"
}

interface ReviewVaultProps {
  receipts: UnverifiedReceipt[]
  onVerify: (id: string, verifiedData: any) => void
  onReject: (id: string) => void
  onBatchVerify: (ids: string[]) => void
}

export function ReviewVault({
  receipts,
  onVerify,
  onReject,
  onBatchVerify,
}: ReviewVaultProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleEdit = (receipt: UnverifiedReceipt) => {
    setEditingId(receipt.id)
    setEditData({
      amount: receipt.fields.amount.value,
      date: receipt.fields.date.value,
      vendor: receipt.fields.vendor.value,
      tpn: receipt.fields.tpn.value,
      gstin: receipt.fields.gstin.value,
      gstAmount: receipt.fields.gstAmount.value,
    })
  }

  const handleSave = (id: string) => {
    onVerify(id, editData)
    setEditingId(null)
    setEditData({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(receipts.map((r) => r.id))
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const handleBatchVerify = () => {
    onBatchVerify(selectedIds)
    setSelectedIds([])
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500"
    if (confidence >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return "high"
    if (confidence >= 70) return "medium"
    return "low"
  }

  const pendingReceipts = receipts.filter((r) => r.status === "pending")

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Review
                </p>
                <p className="text-2xl font-bold">{pendingReceipts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  With TPN
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {
                    pendingReceipts.filter((r) => r.fields.tpn.hasTPN)
                      .length
                  }
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
                <p className="text-sm text-muted-foreground">
                  No TPN
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {
                    pendingReceipts.filter((r) => !r.fields.tpn.hasTPN)
                      .length
                  }
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  GST Claimable
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    pendingReceipts
                      .filter((r) => r.fields.tpn.hasTPN)
                      .reduce(
                        (sum, r) =>
                          sum +
                          (Number(r.fields.gstAmount.value) || 0),
                        0
                      )
                  )}
                </p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      {pendingReceipts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedIds.length === pendingReceipts.length}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedIds.length === 0}
                >
                  Clear Selection
                </Button>
                {selectedIds.length > 0 && (
                  <Badge variant="secondary">
                    {selectedIds.length} selected
                  </Badge>
                )}
              </div>

              <Button
                onClick={handleBatchVerify}
                disabled={selectedIds.length === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify Selected ({selectedIds.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipts List */}
      <div className="space-y-4">
        {pendingReceipts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  All caught up!
                </h3>
                <p className="text-muted-foreground">
                  No receipts pending review. Great job!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingReceipts.map((receipt) => (
            <Card
              key={receipt.id}
              className={cn(
                "transition-all",
                !receipt.fields.tpn.hasTPN && "border-red-500/50 bg-red-500/5",
                selectedIds.includes(receipt.id) && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(receipt.id)}
                      onChange={() => toggleSelect(receipt.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {receipt.fileName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(receipt.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!receipt.fields.tpn.hasTPN && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No TPN - GST Not Claimable
                      </Badge>
                    )}
                    {editingId === receipt.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(receipt.id)}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(receipt)}
                          className="gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(receipt)}
                          className="gap-1 text-green-500 hover:text-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(receipt.id)}
                          className="gap-1 text-red-500 hover:text-red-600"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                      Amount
                    </label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.amount}
                        onChange={(e) =>
                          setEditData({ ...editData, amount: e.target.value })
                        }
                        type="number"
                      />
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(Number(receipt.fields.amount.value))}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.amount.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(receipt.fields.amount.confidence)
                            )}
                          >
                            {receipt.fields.amount.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Date
                    </label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.date}
                        onChange={(e) =>
                          setEditData({ ...editData, date: e.target.value })
                        }
                        type="date"
                      />
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">
                          {receipt.fields.date.value}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.date.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(receipt.fields.date.confidence)
                            )}
                          >
                            {receipt.fields.date.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vendor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Vendor
                    </label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.vendor}
                        onChange={(e) =>
                          setEditData({ ...editData, vendor: e.target.value })
                        }
                      />
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">
                          {receipt.fields.vendor.value}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.vendor.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(
                                receipt.fields.vendor.confidence
                              )
                            )}
                          >
                            {receipt.fields.vendor.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TPN */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TPN</label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.tpn}
                        onChange={(e) =>
                          setEditData({ ...editData, tpn: e.target.value })
                        }
                        placeholder="Enter Tax Payment Number"
                      />
                    ) : (
                      <div>
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            receipt.fields.tpn.hasTPN
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {receipt.fields.tpn.value || "Not Found"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.tpn.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(receipt.fields.tpn.confidence)
                            )}
                          >
                            {receipt.fields.tpn.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GSTIN */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GSTIN</label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.gstin}
                        onChange={(e) =>
                          setEditData({ ...editData, gstin: e.target.value })
                        }
                        placeholder="Enter GSTIN"
                      />
                    ) : (
                      <div>
                        <p className="text-lg font-semibold">
                          {receipt.fields.gstin.value || "Not Found"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.gstin.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(
                                receipt.fields.gstin.confidence
                              )
                            )}
                          >
                            {receipt.fields.gstin.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GST Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-green-500" />
                      GST Amount
                    </label>
                    {editingId === receipt.id ? (
                      <Input
                        value={editData.gstAmount}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            gstAmount: e.target.value,
                          })
                        }
                        type="number"
                      />
                    ) : (
                      <div>
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            receipt.fields.tpn.hasTPN
                              ? "text-green-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatCurrency(
                            Number(receipt.fields.gstAmount.value) || 0
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={receipt.fields.gstAmount.confidence}
                            className="h-1"
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getConfidenceColor(
                                receipt.fields.gstAmount.confidence
                              )
                            )}
                          >
                            {receipt.fields.gstAmount.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
