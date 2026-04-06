import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PaymentForm } from "@/components/payments/payment-form";

export default async function PaymentsPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Process payments through RMA (Royal Monetary Authority) of Bhutan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Payment Form */}
        <div className="lg:col-span-2">
          <PaymentForm
            organizationId={orgId}
            defaultAmount={0}
            defaultDescription=""
          />
        </div>

        {/* Sidebar - Information */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Payment Methods Info */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Accepted Payment Methods</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">QR</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">QR Code Payment</div>
                    <div className="text-xs text-muted-foreground">
                      Scan with any mobile banking app in Bhutan
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">MB</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Mobile Banking</div>
                    <div className="text-xs text-muted-foreground">
                      Direct payment through your banking app
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">BT</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Bank Transfer</div>
                    <div className="text-xs text-muted-foreground">
                      Transfer directly to our bank account
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Secure Payments</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>All payments are processed through RMA (Royal Monetary Authority) of Bhutan.</p>
                <p>Your payment information is encrypted and secure.</p>
                <p>We never store your complete payment details.</p>
              </div>
            </div>

            {/* Support */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  If you encounter any issues with your payment, please contact our support team.
                </p>
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground">Email Support</div>
                  <div className="font-medium">support@silverpineledger.bt</div>
                </div>
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground">Phone Support</div>
                  <div className="font-medium">+975 2 345 678</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}