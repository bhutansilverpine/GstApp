import { redirect } from "next/navigation";
import { getCurrentOrganizationId } from "@/server";
import { getTrialBalance } from "@/lib/db/queries";
import { BITExportWizard } from "@/components/bit/export-wizard";
import { BITDataPreview } from "@/components/bit/preview";
import { db, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function BITExportPage() {
  const organizationId = await getCurrentOrganizationId();

  // Fetch organization details
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    redirect("/dashboard");
  }

  // Fetch trial balance for preview
  const trialBalance = await getTrialBalance(organizationId, new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Income Tax (BIT) Export</h1>
        <p className="text-muted-foreground mt-2">
          Generate Bhutan Business Income Tax compliant Excel exports for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Export Wizard */}
        <div className="lg:col-span-2">
          <BITExportWizard
            organizationId={organizationId}
            organizationName={org.name}
            organizationTPN={org.tpn || "NOT SET"}
          />
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Data Preview</h2>
              <p className="text-sm text-muted-foreground">
                Review your financial data before export
              </p>
            </div>
            <BITDataPreview
              trialBalance={trialBalance}
              organizationName={org.name}
              organizationTPN={org.tpn || "NOT SET"}
              gstRegistered={org.gstRegistered || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}