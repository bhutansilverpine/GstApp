/**
 * RMA Payment Type Definitions
 *
 * This file contains TypeScript type definitions for the RMA (Royal Monetary Authority)
 * payment integration system for Bhutan.
 */

// ============================================
// Payment Types
// ============================================

export type RMAPaymentStatusType = "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled";

export type RMAPaymentMethod = "qr-code" | "mobile-banking" | "bank-transfer" | "card";

export type RMACurrency = "BTN" | "USD";

// ============================================
// Payment Request Types
// ============================================

export interface RMAPaymentRequest {
  amount: number;
  currency: RMACurrency;
  description: string;
  reference?: string;
  merchantId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  webhookUrl?: string;
  expiryMinutes?: number;
}

export interface RMAPaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  status: RMAPaymentStatusType;
  message?: string;
  error?: string;
  expiresAt?: Date;
}

// ============================================
// Payment Status Types
// ============================================

export interface RMAPaymentStatusInfo {
  paymentId: string;
  status: RMAPaymentStatusType;
  amount: number;
  currency: RMACurrency;
  paidAmount?: number;
  refundedAmount?: number;
  transactionId?: string;
  bankReference?: string;
  completedAt?: Date;
  failedReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Refund Types
// ============================================

export interface RMARefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface RMARefundResponse {
  success: boolean;
  refundId?: string;
  status: "pending" | "completed" | "failed";
  message?: string;
  error?: string;
}

// ============================================
// Webhook Types
// ============================================

export interface RMAWebhookEvent {
  eventType: "payment.completed" | "payment.failed" | "payment.pending" | "payment.expired" | "refund.completed";
  paymentId: string;
  timestamp: Date;
  data: {
    amount: number;
    currency: RMACurrency;
    status: RMAPaymentStatusType;
    transactionId?: string;
    bankReference?: string;
    completedAt?: Date;
    failedReason?: string;
  };
  signature: string;
}

export interface RMAWebhookVerification {
  isValid: boolean;
  event?: RMAWebhookEvent;
  error?: string;
}

// ============================================
// Merchant Types
// ============================================

export interface RMAMerchantConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  environment: "sandbox" | "production";
  webhookUrl?: string;
  callbackUrl?: string;
  defaultExpiryMinutes: number;
  supportedMethods: RMAPaymentMethod[];
  supportedCurrencies: RMACurrency[];
}

// ============================================
// Transaction Types
// ============================================

export interface RMAPaymentTransaction {
  id: string;
  organizationId: string;
  paymentId: string;
  amount: number;
  currency: RMACurrency;
  description: string;
  reference?: string;
  status: RMAPaymentStatusType;
  method: RMAPaymentMethod;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  transactionId?: string;
  bankReference?: string;
  qrCodeData?: string;
  paymentUrl?: string;
  expiresAt?: Date;
  completedAt?: Date;
  failedReason?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface RMAApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// ============================================
// Validation Types
// ============================================

export interface RMAPaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

// ============================================
// Report Types
// ============================================

export interface RMAPaymentReport {
  organizationId: string;
  period: {
    from: Date;
    to: Date;
  };
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  completedAmount: number;
  failedTransactions: number;
  refundedTransactions: number;
  refundedAmount: number;
  pendingTransactions: number;
  pendingAmount: number;
  averageProcessingTime: number;
  successRate: number;
  transactions: RMAPaymentTransaction[];
}

// ============================================
// Error Types
// ============================================

export class RMAError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "RMAError";
  }
}

export const RMA_ERROR_CODES = {
  INVALID_REQUEST: "INVALID_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  PAYMENT_EXPIRED: "PAYMENT_EXPIRED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  REFUND_FAILED: "REFUND_FAILED",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
  TIMEOUT: "TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;