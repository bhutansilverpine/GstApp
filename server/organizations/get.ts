import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { seedChartOfAccounts } from "@/lib/db/seed";

/**
 * Get the current organization ID based on the authenticated Clerk user.
 * If no organization exists in the database for the current Clerk org,
 * one is automatically created and seeded with a default chart of accounts.
 */
export async function getCurrentOrganizationId(): Promise<string> {
  const session = await auth();
  const { orgId, userId } = session;

  if (!userId) {
    throw new Error("Unauthorized: User not found in session");
  }

  // Use the Clerk orgId if available, otherwise fallback to a personal user-scoped ID
  const clerkId = orgId || `user_${userId}`;

  // Find the organization in the database
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, clerkId),
  });

  if (!org) {
    console.log(`Creating new organization for Clerk ID: ${clerkId}`);
    
    // Auto-create organization if it doesn't exist
    const [newOrg] = await db
      .insert(organizations)
      .values({
        clerkOrgId: clerkId,
        name: orgId ? "Business Organization" : "Personal Workspace",
        gstRegistered: true,
        gstRate: "15",
        fiscalYearEnd: "03-31",
        settings: {
          currency: "NZD",
          dateFormat: "DD/MM/YYYY",
          timezone: "Pacific/Auckland",
        },
      })
      .returning();
    
    org = newOrg;
    
    // Seed default chart of accounts for the new organization
    console.log(`Seeding chart of accounts for org: ${org.id}`);
    await seedChartOfAccounts(org.id);
  }

  return org.id;
}
