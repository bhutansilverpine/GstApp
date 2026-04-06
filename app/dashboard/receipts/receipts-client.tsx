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
import { useRouter } from "next/navigation"
import { processReceipts } from "@/server/receipts/process"
import { verifyReceipt, deleteReceipt, rejectReceipt } from "@/server/receipts/verify"

interface ReceiptsClientProps {
  initialUnverified: any[]
  initialVerified: any[]
  initialGSTSummary: any
  organizationId: string
}

export function ReceiptsClient({
  initialUnverified,
  initialVerified,
  initialGSTSummary,
  organizationId,
}: ReceiptsClientProps) {
  const router = useRouter()
  const [unverifiedReceipts, setUnverifiedReceipts] = useState(initialUnverified)
  const [verifiedReceipts, setVerifiedReceipts] = useState(initialVerified)
  const [activeTab, setActiveTab] = useState("overview")

  const handleUpload = async (files: File[]) => {
    try {
      const results = []
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        const response = await processReceipts(formData, organizationId)
        results.push(response)
      }
      
      const successCount = results.filter(r => r.success).length
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} receipt(s)`)
        router.refresh()
      } else {
        toast.error("Failed to process receipts")
      }
    } catch (error) {
      toast.error("Upload error")
    }
  }

  const handleVerify = async (id: string, verifiedData: any) => {
    try {
      const response = await verifyReceipt(id, organizationId, {
        vendorName: verifiedData.vendor,
        vendorTpn: verifiedData.tpn,
        vendorGstNumber: verifiedData.gstin,
        date: new Date(verifiedData.date),
        totalAmount: verifiedData.amount.toString(),
        gstAmount: verifiedData.gstAmount.toString(),
        category: verifiedData.category || "General",
      })

      if (response.success) {
        toast.success("Receipt verified successfully")
        router.refresh()
      } else {
        toast.error(response.error || "Verification failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await rejectReceipt(id, organizationId, "Manual rejection by user")
      if (response.success) {
        toast.success("Receipt rejected")
        router.refresh()
      } else {
        toast.error(response.error || "Rejection failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteReceipt(id, organizationId)
      if (response.success) {
        toast.success("Receipt deleted")
        router.refresh()
      } else {
        toast.error(response.error || "Deletion failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Manage and track your business receipts for GST compliance
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
                  ₹{initialGSTSummary.totalGST.toFixed(0)}
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
                <p className="text-sm text-muted-foreground">Verification Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((verifiedReceipts.length / (initialVerified.length + initialUnverified.length || 1)) * 100)}%
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
          <GSTSummary data={initialGSTSummary} dateRange="Current Period" />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <UploadZone onUpload={handleUpload} />
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <ReviewVault
            receipts={unverifiedReceipts}
            onVerify={handleVerify}
            onReject={handleReject}
            onBatchVerify={() => toast.info("Batch verify not implemented yet")}
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
