import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Organization } from "./db/schema";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * Get the current organization from the request
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const { orgId } = await auth();

  if (!orgId) {
    return null;
  }

  try {
    const { db } = await import("./db");
    const { organizations } = await import("./db/schema");
    const { eq } = await import("drizzle-orm");

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.clerkOrgId, orgId))
      .limit(1);

    return organization || null;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

/**
 * Require authentication - returns user or throws error
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Require organization - returns organization or throws error
 */
export async function requireOrganization(): Promise<Organization> {
  const organization = await getCurrentOrganization();

  if (!organization) {
    throw new Error("Organization required. Please select or create an organization.");
  }

  return organization;
}

/**
 * Check if user has access to specific organization
 */
export async function hasAccessToOrganization(organizationId: string): Promise<boolean> {
  const { orgId } = await auth();

  if (!orgId) {
    return false;
  }

  try {
    const { db } = await import("./db");
    const { organizations } = await import("./db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [organization] = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizations.clerkOrgId, orgId)
        )
      )
      .limit(1);

    return !!organization;
  } catch (error) {
    console.error("Error checking organization access:", error);
    return false;
  }
}

/**
 * Middleware helper to protect API routes
 */
export async function protectApiRoute() {
  try {
    const user = await requireAuth();
    const organization = await requireOrganization();

    return { user, organization };
  } catch (error) {
    throw new Error("Unauthorized: Authentication and organization required");
  }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden") {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Get organization switch URL
 */
export function getOrganizationSwitchUrl(returnUrl: string = "/dashboard") {
  return `/organization-switch?returnUrl=${encodeURIComponent(returnUrl)}`;
}

/**
 * Validate organization access for API routes
 */
export async function validateOrganizationAccess(organizationId: string) {
  const hasAccess = await hasAccessToOrganization(organizationId);

  if (!hasAccess) {
    throw new Error("You don't have access to this organization");
  }

  return true;
}

/**
 * Get user's permissions (placeholder for future permission system)
 */
export async function getUserPermissions() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  // This would be expanded based on your permission system
  // For now, return basic permissions
  return [
    "view:dashboard",
    "view:transactions",
    "create:transactions",
    "view:accounts",
    "view:reports",
  ];
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasPerm = await hasPermission(permission);

  if (!hasPerm) {
    throw new Error(`Permission required: ${permission}`);
  }
}

/**
 * Type for authenticated request context
 */
export interface AuthContext {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  organization: Awaited<ReturnType<typeof getCurrentOrganization>>;
}

/**
 * Get complete auth context for a request
 */
export async function getAuthContext(): Promise<AuthContext> {
  const user = await getCurrentUser();
  const organization = await getCurrentOrganization();

  return {
    user,
    organization,
  };
}