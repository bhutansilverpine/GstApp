/**
 * Google Authentication Integration
 *
 * This file handles OAuth token management for Google services (Drive, Sheets)
 * using Clerk's built-in OAuth integration for user tokens.
 */

import { auth } from "@clerk/nextjs/server";

// ============================================
// Types
// ============================================

export interface GoogleTokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes: string[];
}

export interface GoogleAuthState {
  isConnected: boolean;
  hasDriveAccess: boolean;
  hasSheetsAccess: boolean;
  tokenExpiry?: Date;
  error?: string;
}

// ============================================
// OAuth Scopes
// ============================================

const GOOGLE_SCOPES = {
  DRIVE: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  SHEETS: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ],
} as const;

// ============================================
// Token Management Functions
// ============================================

/**
 * Get Google OAuth token for current user from Clerk
 */
export async function getGoogleOAuthToken(): Promise<string | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("No user authenticated");
      return null;
    }

    // Get user's OAuth tokens from Clerk
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/google`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      console.log("No Google OAuth tokens found for user");
      return null;
    }

    const data = await response.json();

    // Clerk returns the OAuth token data
    if (data && data.length > 0) {
      const token = data[0].token;
      return token;
    }

    return null;
  } catch (error) {
    console.error("Error getting Google OAuth token:", error);
    return null;
  }
}

/**
 * Check if user has Google integration enabled
 */
export async function hasGoogleIntegration(): Promise<boolean> {
  const token = await getGoogleOAuthToken();
  return token !== null;
}

/**
 * Get user's Google OAuth connection state
 */
export async function getGoogleAuthState(): Promise<GoogleAuthState> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        isConnected: false,
        hasDriveAccess: false,
        hasSheetsAccess: false,
        error: "Not authenticated",
      };
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/oauth_connections/google`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        isConnected: false,
        hasDriveAccess: false,
        hasSheetsAccess: false,
      };
    }

    const connections = await response.json();

    if (!connections || connections.length === 0) {
      return {
        isConnected: false,
        hasDriveAccess: false,
        hasSheetsAccess: false,
      };
    }

    const connection = connections[0];
    const scopes = connection.scopes || [];

    // Check specific scopes
    const hasDriveAccess = scopes.some((scope: string) =>
      GOOGLE_SCOPES.DRIVE.includes(scope as any)
    );

    const hasSheetsAccess = scopes.some((scope: string) =>
      GOOGLE_SCOPES.SHEETS.includes(scope as any)
    );

    return {
      isConnected: true,
      hasDriveAccess,
      hasSheetsAccess,
      tokenExpiry: connection.expiresAt ? new Date(connection.expiresAt) : undefined,
    };

  } catch (error) {
    console.error("Error getting Google auth state:", error);
    return {
      isConnected: false,
      hasDriveAccess: false,
      hasSheetsAccess: false,
      error: error instanceof Error ? error.message : "Failed to check Google integration",
    };
  }
}

/**
 * Initiate Google OAuth flow
 */
export async function initiateGoogleAuth(returnUrl: string = "/dashboard"): Promise<string> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Create authorization URL using Clerk's OAuth
    // This will redirect users to grant Google permissions
    const state = encodeURIComponent(JSON.stringify {
      return_url: returnUrl,
      user_id: userId,
    });

    // Construct the Google OAuth URL with required scopes
    const scopes = [
      ...GOOGLE_SCOPES.DRIVE,
      ...GOOGLE_SCOPES.SHEETS,
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      response_type: "code",
      scope: scopes.join(" "),
      state: state,
      access_type: "offline",
      prompt: "consent",
    })}`;

    return authUrl;

  } catch (error) {
    console.error("Error initiating Google auth:", error);
    throw new Error("Failed to initiate Google authentication");
  }
}

/**
 * Disconnect Google integration (revoke tokens)
 */
export async function disconnectGoogleIntegration(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "User must be authenticated",
      };
    }

    // Revoke the OAuth tokens in Clerk
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/oauth_connections/google`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to disconnect Google integration",
      };
    }

    console.log("Google integration disconnected for user:", userId);
    return { success: true };

  } catch (error) {
    console.error("Error disconnecting Google integration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disconnect Google integration",
    };
  }
}

/**
 * Refresh expired Google OAuth token (if supported)
 */
export async function refreshGoogleToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
  try {
    // Clerk handles token refresh automatically for most providers
    // This function is a placeholder for manual refresh if needed

    const currentState = await getGoogleAuthState();

    if (!currentState.isConnected) {
      return {
        success: false,
        error: "No Google integration found",
      };
    }

    // If token is expired, user needs to re-authenticate
    if (currentState.tokenExpiry && currentState.tokenExpiry < new Date()) {
      return {
        success: false,
        error: "Token expired. Please re-authenticate with Google.",
      };
    }

    // Get fresh token
    const token = await getGoogleOAuthToken();

    if (!token) {
      return {
        success: false,
        error: "Failed to get fresh token",
      };
    }

    return {
      success: true,
      newToken: token,
    };

  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh Google token",
    };
  }
}

/**
 * Validate that user has required Google scopes
 */
export async function validateGoogleScopes(requiredScopes: string[]): Promise<{
  valid: boolean;
  missing: string[];
}> {
  try {
    const state = await getGoogleAuthState();

    if (!state.isConnected) {
      return {
        valid: false,
        missing: requiredScopes,
      };
    }

    const { userId } = await auth();
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/oauth_connections/google`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        missing: requiredScopes,
      };
    }

    const connections = await response.json();
    const userScopes = connections[0]?.scopes || [];

    const missing = requiredScopes.filter(scope =>
      !userScopes.includes(scope)
    );

    return {
      valid: missing.length === 0,
      missing,
    };

  } catch (error) {
    console.error("Error validating Google scopes:", error);
    return {
      valid: false,
      missing: requiredScopes,
    };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user has Drive access
 */
export async function hasDriveAccess(): Promise<boolean> {
  const state = await getGoogleAuthState();
  return state.isConnected && state.hasDriveAccess;
}

/**
 * Check if user has Sheets access
 */
export async function hasSheetsAccess(): Promise<boolean> {
  const state = await getGoogleAuthState();
  return state.isConnected && state.hasSheetsAccess;
}

/**
 * Get Google OAuth URL for client-side redirect
 */
export function getGoogleOAuthUrl(redirectUrl: string = "/dashboard"): string {
  const state = encodeURIComponent(JSON.stringify({
    return_url: redirectUrl,
  }));

  const scopes = [
    ...GOOGLE_SCOPES.DRIVE,
    ...GOOGLE_SCOPES.SHEETS,
  ];

  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    response_type: "code",
    scope: scopes.join(" "),
    state: state,
    access_type: "offline",
    prompt: "consent",
  })}`;
}