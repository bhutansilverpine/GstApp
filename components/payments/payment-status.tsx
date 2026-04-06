"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { RMAPaymentStatus } from "@/server/payments/types";

interface PaymentStatusDisplayProps {
  paymentId: string;
  status: RMAPaymentStatus;
  amount: number;
  currency: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  transactionId?: string;
  bankReference?: string;
  completedAt?: Date;
  failedReason?: string;
  expiresAt?: Date;
  onRefresh?: () => void;
  onCopyPaymentId?: () => void;
}

export function PaymentStatusDisplay({
  paymentId,
  status,
  amount,
  currency,
  paymentUrl,
  qrCodeUrl,
  transactionId,
  bankReference,
  completedAt,
  failedReason,
  expiresAt,
  onRefresh,
  onCopyPaymentId,
}: PaymentStatusDisplayProps) {
  const getStatusConfig = (status: RMAPaymentStatus) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          badgeVariant: "default" as const,
          label: "Payment Completed",
          description: "Your payment has been successfully processed",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          badgeVariant: "secondary" as const,
          label: "Payment Pending",
          description: "Your payment is being processed",
        };
      case "processing":
        return {
          icon: RefreshCw,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          badgeVariant: "secondary" as const,
          label: "Payment Processing",
          description: "Your payment is being confirmed",
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          badgeVariant: "destructive" as const,
          label: "Payment Failed",
          description: failedReason || "Your payment could not be processed",
        };
      case "refunded":
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          badgeVariant: "secondary" as const,
          label: "Payment Refunded",
          description: "Your payment has been refunded",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          badgeVariant: "outline" as const,
          label: "Payment Cancelled",
          description: "This payment has been cancelled",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          badgeVariant: "outline" as const,
          label: "Unknown Status",
          description: "Payment status is unknown",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleString("en-BT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatExpiry = (date?: Date) => {
    if (!date) return null;
    const now = new Date();
    const expiry = new Date(date);
    const minutesLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));

    if (minutesLeft <= 0) return "Expired";
    if (minutesLeft < 60) return `Expires in ${minutesLeft} minutes`;
    const hoursLeft = Math.floor(minutesLeft / 60);
    return `Expires in ${hoursLeft} hours`;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Alert className={`${statusConfig.bgColor} border-none`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
        <AlertTitle className={statusConfig.color}>{statusConfig.label}</AlertTitle>
        <AlertDescription>{statusConfig.description}</AlertDescription>
      </Alert>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Details</CardTitle>
            <Badge variant={statusConfig.badgeVariant}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Amount */}
            <div className="text-center py-6 bg-muted/50 rounded-lg">
              <div className="text-4xl font-bold">
                {formatCurrency(amount)} {currency}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Payment Amount
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Payment ID</div>
                <div className="font-medium font-mono">{paymentId}</div>
              </div>

              {transactionId && (
                <div>
                  <div className="text-muted-foreground">Transaction ID</div>
                  <div className="font-medium font-mono">{transactionId}</div>
                </div>
              )}

              {bankReference && (
                <div>
                  <div className="text-muted-foreground">Bank Reference</div>
                  <div className="font-medium font-mono">{bankReference}</div>
                </div>
              )}

              {completedAt && status === "completed" && (
                <div>
                  <div className="text-muted-foreground">Completed At</div>
                  <div className="font-medium">{formatDate(completedAt)}</div>
                </div>
              )}

              {expiresAt && (status === "pending" || status === "processing") && (
                <div>
                  <div className="text-muted-foreground">Expiry</div>
                  <div className="font-medium">{formatExpiry(expiresAt)}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
              {onRefresh && (status === "pending" || status === "processing") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
              )}

              {onCopyPaymentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyPaymentId}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Payment ID
                </Button>
              )}

              {paymentUrl && status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2"
                >
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open Payment Page
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Tabs */}
      <Tabs defaultValue="help" className="w-full">
        <TabsList>
          <TabsTrigger value="help">Help & Support</TabsTrigger>
          <TabsTrigger value="info">Payment Information</TabsTrigger>
        </TabsList>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Payment Pending?</div>
                <div className="text-muted-foreground">
                  Keep this page open and wait for the payment to process. You can also
                  scan the QR code using your mobile banking app.
                </div>
              </div>
              <div>
                <div className="font-medium">Payment Failed?</div>
                <div className="text-muted-foreground">
                  Try again with a different payment method or contact your bank if the
                  problem persists.
                </div>
              </div>
              <div>
                <div className="font-medium">Need Assistance?</div>
                <div className="text-muted-foreground">
                  Contact our support team with your Payment ID for assistance.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Payment Method</div>
                <div className="text-muted-foreground">
                  RMA (Royal Monetary Authority) - Bhutan
                </div>
              </div>
              <div>
                <div className="font-medium">Processing Time</div>
                <div className="text-muted-foreground">
                  Usually instant, but may take up to 24 hours
                </div>
              </div>
              <div>
                <div className="font-medium">Security</div>
                <div className="text-muted-foreground">
                  All payments are secured and processed through RMA's secure payment gateway
                </div>
              </div>
              <div>
                <div className="font-medium">Receipt</div>
                <div className="text-muted-foreground">
                  You will receive a payment confirmation via email once the payment is completed
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}