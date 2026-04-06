"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CreditCard, Smartphone, Building, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initializeRMAPayment, type RMAPaymentRequest } from "@/server/payments/rma";
import { QRCodeDisplay } from "./qr-code";
import { PaymentStatusDisplay } from "./payment-status";

interface PaymentFormProps {
  organizationId: string;
  defaultAmount?: number;
  defaultDescription?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  organizationId,
  defaultAmount = 0,
  defaultDescription = "",
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [currentView, setCurrentView] = useState<"form" | "processing" | "status">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<"qr-code" | "mobile-banking" | "bank-transfer">("qr-code");

  // Form state
  const [formData, setFormData] = useState({
    amount: defaultAmount,
    currency: "BTN" as "BTN" | "USD",
    description: defaultDescription,
    reference: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    terms: false,
  });

  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (formData.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }

    if (formData.amount > 1000000) {
      errors.push("Amount cannot exceed Nu. 1,000,000");
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (selectedMethod === "bank-transfer" && !formData.customerName) {
      errors.push("Customer name is required for bank transfer");
    }

    if (!formData.terms) {
      errors.push("You must accept the terms and conditions");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validation.errors.join(", "),
      });
      return;
    }

    setIsSubmitting(true);
    setCurrentView("processing");

    try {
      const paymentRequest: RMAPaymentRequest = {
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        reference: formData.reference || undefined,
        merchantId: organizationId,
        customerId: undefined,
        customerName: formData.customerName || undefined,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        metadata: {
          organizationId,
          paymentMethod: selectedMethod,
        },
      };

      const response = await initializeRMAPayment(paymentRequest);

      if (response.success) {
        setPaymentResult(response);
        setCurrentView("status");
        toast({
          title: "Payment Initialized",
          description: "Please complete the payment using your preferred method",
        });
        onSuccess?.(response);
      } else {
        throw new Error(response.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: errorMessage,
      });
      setCurrentView("form");
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = useCallback(async () => {
    // In a real implementation, you would check the payment status
    toast({
      title: "Checking Status",
      description: "Refreshing payment status...",
    });
  }, [toast]);

  const handleCopyPaymentId = useCallback(() => {
    if (paymentResult?.paymentId) {
      navigator.clipboard.writeText(paymentResult.paymentId);
      toast({
        title: "Copied",
        description: "Payment ID copied to clipboard",
      });
    }
  }, [paymentResult?.paymentId, toast]);

  if (currentView === "processing") {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Initializing Payment</h3>
        <p className="text-sm text-muted-foreground text-center">
          Please wait while we set up your payment...
        </p>
      </div>
    );
  }

  if (currentView === "status" && paymentResult) {
    return (
      <div className="space-y-6">
        {/* QR Code for QR code payments */}
        {selectedMethod === "qr-code" && paymentResult.qrCodeData && (
          <QRCodeDisplay
            data={paymentResult.qrCodeUrl || ""}
            title="Scan to Pay"
            description="Use your mobile banking app to scan this QR code and complete the payment"
          />
        )}

        {/* Payment Status */}
        <PaymentStatusDisplay
          paymentId={paymentResult.paymentId}
          status={paymentResult.status}
          amount={formData.amount}
          currency={formData.currency}
          paymentUrl={paymentResult.paymentUrl}
          qrCodeUrl={paymentResult.qrCodeUrl}
          expiresAt={paymentResult.expiresAt}
          onRefresh={handleRefreshStatus}
          onCopyPaymentId={handleCopyPaymentId}
        />

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentView("form");
              setPaymentResult(null);
            }}
          >
            Make Another Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter the payment details and select your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", parseFloat(e.target.value))}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange("currency", value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTN">BTN (Ngultrum)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required
                placeholder="Enter payment description (e.g., Invoice #12345)"
                rows={2}
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                placeholder="Invoice number, order ID, etc."
              />
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <Label>Customer Information (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Tshering Wangdi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="tshering@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="+975 17 123 456"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label>Payment Method *</Label>
              <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="qr-code" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="mobile-banking" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Mobile Banking
                  </TabsTrigger>
                  <TabsTrigger value="bank-transfer" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="qr-code" className="space-y-4 mt-4">
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertTitle>QR Code Payment</AlertTitle>
                    <AlertDescription>
                      Scan the QR code with your mobile banking app to complete the payment instantly.
                      Supported by all major banks in Bhutan.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="mobile-banking" className="space-y-4 mt-4">
                  <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertTitle>Mobile Banking</AlertTitle>
                    <AlertDescription>
                      You'll be redirected to your mobile banking app to complete the payment.
                      Make sure you have your banking app installed.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="bank-transfer" className="space-y-4 mt-4">
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertTitle>Bank Transfer</AlertTitle>
                    <AlertDescription>
                      Transfer the payment directly to our bank account. You'll receive the bank
                      details after confirming the payment.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => handleInputChange("terms", checked)}
                required
              />
              <Label htmlFor="terms" className="text-sm leading-tight">
                I agree to the terms and conditions and understand that my payment information
                will be processed securely through RMA (Royal Monetary Authority) of Bhutan.
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !formData.terms}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>

            {/* Security Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Secure Payment</AlertTitle>
              <AlertDescription>
                Your payment is secured with SSL encryption and processed through RMA's
                trusted payment gateway. We do not store your payment information.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}