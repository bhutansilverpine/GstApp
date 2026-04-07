import { Suspense } from "react";
import { getCurrentOrganizationId } from "@/server";
import { ReceiptUploadFlow } from "@/components/receipts/receipt-upload-flow";

export default async function ReceiptUploadPage() {
  const organizationId = await getCurrentOrganizationId();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">
          AI-powered receipt extraction directly to your Google Sheets
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ReceiptUploadFlow organizationId={organizationId} />
      </Suspense>
    </div>
  );
}
