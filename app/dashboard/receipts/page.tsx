"use client"

import { useState } from "react"
import { UploadZone } from "@/components/receipts/upload-zone"
import { ReviewVault } from "@/components/receipts/review-vault"
import { ReceiptList } from "@/components/receipts/receipt-list"
import { GSTSummary } from "@/components/receipts/gst-summary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  FileText,
  Upload,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  IndianRupee,
} from "lucide-react"

// Mock data - replace with actual API calls
const mockUnverifiedReceipts = [
  {
    id: "1",
    fileName: "amazon_purchase.pdf",
    uploadedAt: new Date().toISOString(),
    fields: {
      amount: { value: 4500, confidence: 95, isEditable: true },
      date: { value: "2026-04-05", confidence: 98, isEditable: true },
      vendor: { value: "Amazon India", confidence: 92, isEditable: true },
      tpn: {
        value: "29AABCU9603R1ZM",
        confidence: 88,
        isEditable: true,
        hasTPN: true,
      },
      gstin: {
        value: "29AABCU9603R1ZM",
        confidence: 88,
        isEditable: true,
      },
      gstAmount: { value: 675, confidence: 90, isEditable: true },
    },
    status: "pending" as const,
  },
  {
    id: "2",
    fileName: "office_supplies.pdf",
    uploadedAt: new Date().toISOString(),
    fields: {
      amount: { value: 2300, confidence: 87, isEditable: true },
      date: { value: "2026-04-04", confidence: 85, isEditable: true },
      vendor: { value: "Office Depot", confidence: 89, isEditable: true },
      tpn: {
        value: "",
        confidence: 0,
        isEditable: true,
        hasTPN: false,
      },
      gstin: {
        value: "",
        confidence: 0,
        isEditable: true,
      },
      gstAmount: { value: 345, confidence: 75, isEditable: true },
    },
    status: "pending" as const,
  },
]

const mockVerifiedReceipts = [
  {
    id: "3",
    fileName: "hotel_invoice.pdf",
    amount: 8500,
    date: "2026-04-01",
    vendor: "Taj Hotels",
    hasTPN: true,
    gstAmount: 1275,
    category: "Travel",
    status: "verified" as const,
  },
  {
    id: "4",
    fileName: "restaurant_bill.pdf",
    amount: 1800,
    date: "2026-03-28",
    vendor: "Pizza Hut",
    hasTPN: false,
    gstAmount: 270,
    category: "Meals",
    status: "verified" as const,
  },
]

const mockGSTSummaryData = {
  totalGST: 2565,
  claimableGST: 1950,
  nonClaimableGST: 615,
  totalReceipts: 4,
  receiptsWithTPN: 2,
  receiptsWithoutTPN: 2,
  averageConfidence: 89.5,
  monthlyComparison: {
    currentMonth: 1950,
    previousMonth: 1650,
    percentageChange: 18.2,
  },
  breakdown: [
    {
      category: "Travel",
      amount: 1275,
      percentage: 49.7,
      claimable: true,
    },
    {
      category: "Office Supplies",
      amount: 675,
      percentage: 26.3,
      claimable: true,
    },
    {
      category: "Meals",
      amount: 270,
      percentage: 10.5,
      claimable: false,
    },
    {
      category: "Technology",
      amount: 345,
      percentage: 13.5,
      claimable: false,
    },
  ],
}

export default function ReceiptsPage() {
  const [unverifiedReceipts, setUnverifiedReceipts] = useState(mockUnverifiedReceipts)
  const [verifiedReceipts, setVerifiedReceipts] = useState(mockVerifiedReceipts)
  const [activeTab, setActiveTab] = useState("overview")

  const handleUpload = async (files: File[]) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`Successfully uploaded ${files.length} receipt(s)`)
  }

  const handleVerify = (id: string, verifiedData: any) => {
    const receipt = unverifiedReceipts.find((r) => r.id === id)
    if (receipt) {
      setVerifiedReceipts([
        ...verifiedReceipts,
        {
          id: receipt.id,
          fileName: receipt.fileName,
          amount: Number(verifiedData.amount),
          date: verifiedData.date,
          vendor: verifiedData.vendor,
          hasTPN: !!verifiedData.tpn,
          gstAmount: Number(verifiedData.gstAmount),
          category: "General",
          status: "verified" as const,
        },
      ])
      setUnverifiedReceipts(unverifiedReceipts.filter((r) => r.id !== id))
      toast.success("Receipt verified successfully")
    }
  }

  const handleReject = (id: string) => {
    setUnverifiedReceipts(unverifiedReceipts.filter((r) => r.id !== id))
    toast.success("Receipt rejected")
  }

  const handleBatchVerify = (ids: string[]) => {
    ids.forEach((id) => {
      const receipt = unverifiedReceipts.find((r) => r.id === id)
      if (receipt) {
        setVerifiedReceipts([
          ...verifiedReceipts,
          {
            id: receipt.id,
            fileName: receipt.fileName,
            amount: Number(receipt.fields.amount.value),
            date: receipt.fields.date.value as string,
            vendor: receipt.fields.vendor.value as string,
            hasTPN: receipt.fields.tpn.hasTPN,
            gstAmount: Number(receipt.fields.gstAmount.value),
            category: "General",
            status: "verified" as const,
          },
        ])
      }
    })
    setUnverifiedReceipts(unverifiedReceipts.filter((r) => !ids.includes(r.id)))
    toast.success(`Verified ${ids.length} receipts`)
  }

  const handleDelete = (id: string) => {
    setVerifiedReceipts(verifiedReceipts.filter((r) => r.id !== id))
    toast.success("Receipt deleted")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Manage and track your business receipts
          </p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab("upload")}>
          <Upload className="h-4 w-4" />
          Upload Receipts
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">
                  {unverifiedReceipts.length + verifiedReceipts.length}
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
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {unverifiedReceipts.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GST Claimable</p>
                <p className="text-2xl font-bold text-green-500">
                  ₹{mockGSTSummaryData.claimableGST.toFixed(0)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">TPN Coverage</p>
                <p className="text-2xl font-bold">
                  {((mockGSTSummaryData.receiptsWithTPN / mockGSTSummaryData.totalReceipts) * 100).toFixed(0)}%
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="review">
            Review Vault
            {unverifiedReceipts.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unverifiedReceipts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="list">All Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GSTSummary data={mockGSTSummaryData} dateRange="April 2026" />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <UploadZone onUpload={handleUpload} />
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <ReviewVault
            receipts={unverifiedReceipts}
            onVerify={handleVerify}
            onReject={handleReject}
            onBatchVerify={handleBatchVerify}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <ReceiptList
            receipts={verifiedReceipts}
            onDelete={handleDelete}
            onView={(receipt) => console.log("View", receipt)}
            onDownload={(receipt) => console.log("Download", receipt)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
