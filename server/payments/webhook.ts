/**
 * RMA Payment Webhook Handler
 *
 * This file contains webhook handlers for processing payment notifications
 * from the Royal Monetary Authority (RMA) payment system.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateRMAWebhook } from "./rma";
import { RMAWebhookEvent } from "./types";

// ============================================
// Webhook Handler
// ============================================

/**
 * Handle incoming RMA webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Received RMA webhook notification");

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature from headers
    const signature = request.headers.get("X-RMA-Signature");
    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const validation = await validateRMAWebhook(rawBody, signature);
    if (!validation.isValid) {
      console.error("Invalid webhook signature:", validation.error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let event: RMAWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error("Failed to parse webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    console.log("Processing webhook event:", {
      eventType: event.eventType,
      paymentId: event.paymentId,
      timestamp: event.timestamp,
    });

    // Process the webhook event
    await processWebhookEvent(event);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error processing RMA webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Process webhook event
 */
async function processWebhookEvent(event: RMAWebhookEvent): Promise<void> {
  switch (event.eventType) {
    case "payment.completed":
      await handlePaymentCompleted(event);
      break;

    case "payment.failed":
      await handlePaymentFailed(event);
      break;

    case "payment.pending":
      await handlePaymentPending(event);
      break;

    case "payment.expired":
      await handlePaymentExpired(event);
      break;

    case "refund.completed":
      await handleRefundCompleted(event);
      break;

    default:
      console.warn("Unknown webhook event type:", event.eventType);
  }
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(event: RMAWebhookEvent): Promise<void> {
  console.log("Handling payment completed:", event.paymentId);

  try {
    // In a real implementation, you would:
    // 1. Update payment status in your database
    // 2. Update related transaction records
    // 3. Send confirmation email to customer
    // 4. Trigger any business logic (e.g., activate subscription, process order)
    // 5. Log the event for audit purposes

    // Example database update (pseudo-code):
    // await db.payments.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "completed",
    //     transactionId: event.data.transactionId,
    //     bankReference: event.data.bankReference,
    //     completedAt: event.data.completedAt,
    //   }
    // });

    console.log("Payment completed successfully:", event.paymentId);

  } catch (error) {
    console.error("Error handling payment completed:", error);
    throw error;
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(event: RMAWebhookEvent): Promise<void> {
  console.log("Handling payment failed:", event.paymentId);

  try {
    // In a real implementation, you would:
    // 1. Update payment status in your database
    // 2. Store failure reason
    // 3. Send notification to customer about failed payment
    // 4. Retry logic if applicable
    // 5. Log the event for audit purposes

    // Example database update (pseudo-code):
    // await db.payments.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "failed",
    //     failedReason: event.data.failedReason,
    //   }
    // });

    console.log("Payment failed:", event.paymentId, event.data.failedReason);

  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
}

/**
 * Handle payment pending event
 */
async function handlePaymentPending(event: RMAWebhookEvent): Promise<void> {
  console.log("Handling payment pending:", event.paymentId);

  try {
    // In a real implementation, you would:
    // 1. Update payment status in your database
    // 2. Send notification to customer about pending payment
    // 3. Schedule status check if needed
    // 4. Log the event for audit purposes

    // Example database update (pseudo-code):
    // await db.payments.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "pending",
    //   }
    // });

    console.log("Payment is pending:", event.paymentId);

  } catch (error) {
    console.error("Error handling payment pending:", error);
    throw error;
  }
}

/**
 * Handle payment expired event
 */
async function handlePaymentExpired(event: RMAWebhookEvent): Promise<void> {
  console.log("Handling payment expired:", event.paymentId);

  try {
    // In a real implementation, you would:
    // 1. Update payment status in your database
    // 2. Send notification to customer about expired payment
    // 3. Clean up any related resources
    // 4. Log the event for audit purposes

    // Example database update (pseudo-code):
    // await db.payments.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "expired",
    //   }
    // });

    console.log("Payment expired:", event.paymentId);

  } catch (error) {
    console.error("Error handling payment expired:", error);
    throw error;
  }
}

/**
 * Handle refund completed event
 */
async function handleRefundCompleted(event: RMAWebhookEvent): Promise<void> {
  console.log("Handling refund completed:", event.paymentId);

  try {
    // In a real implementation, you would:
    // 1. Update refund status in your database
    // 2. Update payment status to refunded (if full refund)
    // 3. Update transaction records
    // 4. Send confirmation email to customer
    // 5. Log the event for audit purposes

    // Example database update (pseudo-code):
    // await db.refunds.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "completed",
    //     completedAt: new Date(),
    //   }
    // });

    // await db.payments.update({
    //   where: { paymentId: event.paymentId },
    //   data: {
    //     status: "refunded",
    //     refundedAmount: event.data.amount,
    //   }
    // });

    console.log("Refund completed:", event.paymentId);

  } catch (error) {
    console.error("Error handling refund completed:", error);
    throw error;
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    webhook: "RMA Payment Webhook",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}