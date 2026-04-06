/**
 * RMA Payment Integration
 *
 * This file contains server actions for integrating with the Royal Monetary Authority (RMA)
 * payment system in Bhutan for processing digital payments.
 */

"use server";

import QRCode from "qrcode";
import crypto from "crypto";
import {
  RMAPaymentRequest,
  RMAPaymentResponse,
  RMAPaymentStatusType,
  RMAPaymentStatusInfo,
  RMARefundRequest,
  RMARefundResponse,
  RMAMerchantConfig,
  RMAApiResponse,
  RMAError,
  RMA_ERROR_CODES,
  type RMAPaymentTransaction,
} from "./types";

// Re-export types that are needed by other modules
export type { RMAPaymentRequest, RMAPaymentResponse, RMAPaymentStatusType };

// ============================================
// Configuration
// ============================================

const RMA_CONFIG: RMAMerchantConfig = {
  merchantId: process.env.RMA_MERCHANT_ID || "test-merchant",
  apiKey: process.env.RMA_API_KEY || "test-api-key",
  apiSecret: process.env.RMA_API_SECRET || "test-api-secret",
  environment: (process.env.RMA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
  webhookUrl: process.env.RMA_WEBHOOK_URL,
  callbackUrl: process.env.RMA_CALLBACK_URL,
  defaultExpiryMinutes: 30,
  supportedMethods: ["qr-code", "mobile-banking", "bank-transfer"],
  supportedCurrencies: ["BTN", "USD"],
};

const RMA_API_URLS = {
  sandbox: "https://sandbox.rma-bhutan.com/api/v1",
  production: "https://api.rma-bhutan.com/api/v1",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get API base URL based on environment
 */
function getApiBaseUrl(): string {
  return RMA_API_URLS[RMA_CONFIG.environment];
}

/**
 * Generate payment signature
 */
function generateSignature(data: any, secret: string): string {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {} as any);

  const queryString = new URLSearchParams(sortedData).toString();
  return crypto
    .createHmac("sha256", secret)
    .update(queryString)
    .digest("hex");
}

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Make API request to RMA
 */
async function makeRMARequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any,
  headers?: Record<string, string>
): Promise<RMAApiResponse<T>> {
  try {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RMA_CONFIG.apiKey}`,
      "X-Merchant-ID": RMA_CONFIG.merchantId,
    };

    const response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new RMAError(
        responseData.message || "RMA API request failed",
        responseData.code || RMA_ERROR_CODES.UNKNOWN_ERROR,
        response.status,
        responseData.details
      );
    }

    return {
      success: true,
      data: responseData.data,
      message: responseData.message,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("RMA API request error:", error);
    if (error instanceof RMAError) {
      throw error;
    }
    throw new RMAError(
      error instanceof Error ? error.message : "Unknown error occurred",
      RMA_ERROR_CODES.NETWORK_ERROR
    );
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Initialize a new RMA payment
 */
export async function initializeRMAPayment(
  request: RMAPaymentRequest
): Promise<RMAPaymentResponse> {
  try {
    console.log("Initializing RMA payment:", {
      amount: request.amount,
      currency: request.currency,
      description: request.description,
    });

    // Validate request
    const validation = validatePaymentRequest(request);
    if (!validation.isValid) {
      throw new RMAError(
        `Invalid payment request: ${validation.errors.join(", ")}`,
        RMA_ERROR_CODES.INVALID_REQUEST
      );
    }

    // Generate payment ID
    const paymentId = generatePaymentId();

    // Prepare payment data
    const paymentData = {
      merchant_id: RMA_CONFIG.merchantId,
      payment_id: paymentId,
      amount: request.amount.toString(),
      currency: request.currency,
      description: request.description,
      reference: request.reference || paymentId,
      customer_id: request.customerId,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.customerPhone,
      callback_url: request.callbackUrl || RMA_CONFIG.callbackUrl,
      webhook_url: request.webhookUrl || RMA_CONFIG.webhookUrl,
      expiry_minutes: request.expiryMinutes || RMA_CONFIG.defaultExpiryMinutes,
      metadata: request.metadata,
    };

    // Generate signature
    const signature = generateSignature(paymentData, RMA_CONFIG.apiSecret);

    // Make API request to create payment
    const response = await makeRMARequest("/payments", "POST", { ...paymentData, signature });

    if (!response.success || !response.data) {
      throw new RMAError(
        response.error || "Failed to create payment",
        RMA_ERROR_CODES.PAYMENT_FAILED
      );
    }

    const rmaPaymentData = response.data as any;

    // Generate QR code for payment
    let qrCodeData: string | undefined;
    if (rmaPaymentData.qr_code_url) {
      qrCodeData = await QRCode.toDataURL(rmaPaymentData.qr_code_url);
    }

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (request.expiryMinutes || RMA_CONFIG.defaultExpiryMinutes));

    console.log("RMA payment initialized successfully:", {
      paymentId,
      status: rmaPaymentData.status,
      expiresAt,
    });

    return {
      success: true,
      paymentId: rmaPaymentData.payment_id || paymentId,
      paymentUrl: rmaPaymentData.payment_url,
      qrCodeUrl: rmaPaymentData.qr_code_url,
      qrCodeData,
      status: rmaPaymentData.status || "pending",
      message: "Payment initialized successfully",
      expiresAt,
    };

  } catch (error) {
    console.error("Error initializing RMA payment:", error);
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to initialize payment",
    };
  }
}

/**
 * Check payment status
 */
export async function checkRMAPaymentStatus(paymentId: string): Promise<RMAPaymentStatusInfo> {
  try {
    console.log("Checking RMA payment status:", paymentId);

    const response = await makeRMARequest(`/payments/${paymentId}`, "GET");

    if (!response.success || !response.data) {
      throw new RMAError(
        response.error || "Failed to check payment status",
        RMA_ERROR_CODES.PAYMENT_NOT_FOUND
      );
    }

    const paymentData = response.data as any;

    return {
      paymentId: paymentData.payment_id,
      status: paymentData.status,
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency,
      paidAmount: paymentData.paid_amount ? parseFloat(paymentData.paid_amount) : undefined,
      refundedAmount: paymentData.refunded_amount ? parseFloat(paymentData.refunded_amount) : undefined,
      transactionId: paymentData.transaction_id,
      bankReference: paymentData.bank_reference,
      completedAt: paymentData.completed_at ? new Date(paymentData.completed_at) : undefined,
      failedReason: paymentData.failed_reason,
      metadata: paymentData.metadata,
      createdAt: new Date(paymentData.created_at),
      updatedAt: new Date(paymentData.updated_at),
    };

  } catch (error) {
    console.error("Error checking RMA payment status:", error);
    throw new RMAError(
      error instanceof Error ? error.message : "Failed to check payment status",
      RMA_ERROR_CODES.PAYMENT_NOT_FOUND
    );
  }
}

/**
 * Process refund
 */
export async function processRMARefund(
  request: RMARefundRequest
): Promise<RMARefundResponse> {
  try {
    console.log("Processing RMA refund:", {
      paymentId: request.paymentId,
      amount: request.amount,
      reason: request.reason,
    });

    // Check if payment exists and is eligible for refund
    const paymentStatus = await checkRMAPaymentStatus(request.paymentId);

    if (paymentStatus.status !== "completed") {
      throw new RMAError(
        "Payment must be completed before refund",
        RMA_ERROR_CODES.REFUND_FAILED
      );
    }

    // Prepare refund data
    const refundData = {
      payment_id: request.paymentId,
      amount: request.amount.toString(),
      reason: request.reason,
      reference: request.reference,
      metadata: request.metadata,
    };

    // Generate signature
    const signature = generateSignature(refundData, RMA_CONFIG.apiSecret);

    // Make API request to process refund
    const response = await makeRMARequest("/refunds", "POST", { ...refundData, signature });

    if (!response.success || !response.data) {
      throw new RMAError(
        response.error || "Failed to process refund",
        RMA_ERROR_CODES.REFUND_FAILED
      );
    }

    const refundDataResponse = response.data as any;

    console.log("RMA refund processed successfully:", {
      refundId: refundDataResponse.refund_id,
      status: refundDataResponse.status,
    });

    return {
      success: true,
      refundId: refundDataResponse.refund_id,
      status: refundDataResponse.status,
      message: "Refund processed successfully",
    };

  } catch (error) {
    console.error("Error processing RMA refund:", error);
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to process refund",
    };
  }
}

/**
 * Cancel payment
 */
export async function cancelRMAPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Cancelling RMA payment:", paymentId);

    const response = await makeRMARequest(`/payments/${paymentId}/cancel`, "POST");

    if (!response.success) {
      throw new Error(response.error || "Failed to cancel payment");
    }

    console.log("RMA payment cancelled successfully:", paymentId);

    return { success: true };

  } catch (error) {
    console.error("Error cancelling RMA payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel payment",
    };
  }
}

/**
 * Generate payment report
 */
export async function generateRMAPaymentReport(
  organizationId: string,
  period: { from: Date; to: Date }
): Promise<{
  success: boolean;
  report?: any;
  error?: string;
}> {
  try {
    console.log("Generating RMA payment report:", {
      organizationId,
      period,
    });

    // In a real implementation, you would fetch payment transactions from your database
    // and aggregate them for the report. For now, we'll return a placeholder.

    const report = {
      organizationId,
      period,
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      failedTransactions: 0,
      refundedTransactions: 0,
      refundedAmount: 0,
      pendingTransactions: 0,
      pendingAmount: 0,
      averageProcessingTime: 0,
      successRate: 0,
      transactions: [],
    };

    return {
      success: true,
      report,
    };

  } catch (error) {
    console.error("Error generating RMA payment report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report",
    };
  }
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate payment request
 */
function validatePaymentRequest(request: RMAPaymentRequest): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate amount
  if (request.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (request.amount > 1000000) {
    warnings.push("Large amount detected - verify transaction limits");
  }

  // Validate currency
  if (!RMA_CONFIG.supportedCurrencies.includes(request.currency)) {
    errors.push(`Unsupported currency: ${request.currency}`);
  }

  // Validate description
  if (!request.description || request.description.trim().length === 0) {
    errors.push("Description is required");
  }

  // Validate expiry
  if (request.expiryMinutes && (request.expiryMinutes < 5 || request.expiryMinutes > 1440)) {
    errors.push("Expiry time must be between 5 and 1440 minutes");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate unique payment ID
 */
function generatePaymentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `PAY-${timestamp}-${random}`.toUpperCase();
}

/**
 * Validate webhook signature
 */
export async function validateRMAWebhook(
  payload: string,
  signature: string
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const isValid = verifySignature(payload, signature, RMA_CONFIG.apiSecret);

    if (!isValid) {
      return {
        isValid: false,
        error: "Invalid webhook signature",
      };
    }

    return { isValid: true };

  } catch (error) {
    console.error("Error validating RMA webhook:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Failed to validate webhook",
    };
  }
}

/**
 * Get payment methods
 */
export async function getRMAPaymentMethods(): Promise<{
  methods: string[];
  currencies: string[];
}> {
  return {
    methods: RMA_CONFIG.supportedMethods,
    currencies: RMA_CONFIG.supportedCurrencies,
  };
}

/**
 * Get merchant configuration
 */
export async function getRMAMerchantConfig(): Promise<{
  merchantId: string;
  environment: string;
  supportedMethods: string[];
  supportedCurrencies: string[];
}> {
  return {
    merchantId: RMA_CONFIG.merchantId,
    environment: RMA_CONFIG.environment,
    supportedMethods: RMA_CONFIG.supportedMethods,
    supportedCurrencies: RMA_CONFIG.supportedCurrencies,
  };
}