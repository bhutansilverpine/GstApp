import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGoogleOAuthToken } from "@/lib/google-auth";

// ============================================
// Google Drive API Helper Functions
// ============================================

/**
 * Create a SilverpineGST folder in user's Google Drive
 */
async function createSilverpineFolder(accessToken: string, orgName: string): Promise<{ folderId: string; folderUrl: string }> {
  // Check if SilverpineGST folder already exists
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(orgName || "SilverpineGST")}'%20and%20mimeType='application/vnd.google-apps.folder'&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    const folder = searchData.files[0];
    return {
      folderId: folder.id,
      folderUrl: `https://drive.google.com/drive/folders/${folder.id}`,
    };
  }

  // Create new folder
  const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: orgName || "SilverpineGST",
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createResponse.ok) {
    throw new Error("Failed to create Google Drive folder");
  }

  const folder = await createResponse.json();

  // Create subfolders for organization
  const subfolders = ["Receipts", "Bank Statements", "Invoices", "Reports", "Journal Entries"];
  await Promise.all(
    subfolders.map((name) =>
      fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [folder.id],
        }),
      })
    )
  );

  return {
    folderId: folder.id,
    folderUrl: `https://drive.google.com/drive/folders/${folder.id}`,
  };
}

/**
 * Upload a file to Google Drive
 */
async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileData: ArrayBuffer | Buffer,
  mimeType: string,
  subfolder?: string
): Promise<{ fileId: string; fileUrl: string }> {
  // If subfolder specified, find its ID
  let parentId = folderId;
  if (subfolder) {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(subfolder)}'%20and%20mimeType='application/vnd.google-apps.folder'%20and%20'${folderId}'%20in%20parents&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      parentId = searchData.files[0].id;
    }
  }

  // Create multipart upload
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const metadata = {
    name: fileName,
    parents: [parentId],
  };

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: " + mimeType + "\r\n\r\n" +
    fileData +
    closeDelimiter;

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody as any,
    }
  );

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to Google Drive");
  }

  const file = await uploadResponse.json();

  // Make file shareable
  await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone",
    }),
  });

  return {
    fileId: file.id,
    fileUrl: `https://drive.google.com/file/d/${file.id}/view`,
  };
}

/**
 * List files in a folder
 */
async function listFiles(accessToken: string, folderId: string): Promise<any[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'%20in%20parents&orderBy=createdTime%20desc&pageSize=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list Google Drive files");
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Get Google Drive connection status and folder info
 */
async function getDriveInfo(accessToken: string, orgName?: string) {
  try {
    // Get user's drive info
    const aboutResponse = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota,user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!aboutResponse.ok) {
      throw new Error("Failed to get Drive info");
    }

    const aboutData = await aboutResponse.json();

    // Check if Silverpine folder exists
    const folder = await createSilverpineFolder(accessToken, orgName);

    return {
      connected: true,
      user: aboutData.user,
      storageQuota: aboutData.storageQuota,
      folderId: folder.folderId,
      folderUrl: folder.folderUrl,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Failed to connect to Google Drive",
    };
  }
}

// ============================================
// API Routes
// ============================================

/**
 * GET /api/google-drive - Get Drive connection status and folder info
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getGoogleOAuthToken();

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        needsConnection: true,
        message: "Please connect your Google Drive account",
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgName = searchParams.get("orgName") || undefined;

    const driveInfo = await getDriveInfo(accessToken, orgName);

    return NextResponse.json(driveInfo);
  } catch (error) {
    console.error("Error getting Google Drive info:", error);
    return NextResponse.json(
      { error: "Failed to get Google Drive info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google-drive - Create folder or upload file
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getGoogleOAuthToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, orgName, fileName, fileData, mimeType, subfolder } = body;

    if (action === "createFolder") {
      const folder = await createSilverpineFolder(accessToken, orgName);
      return NextResponse.json(folder);
    }

    if (action === "uploadFile") {
      if (!fileName || !fileData || !mimeType) {
        return NextResponse.json(
          { error: "fileName, fileData, and mimeType are required" },
          { status: 400 }
        );
      }

      // First get/create the folder
      const folder = await createSilverpineFolder(accessToken, orgName);

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, "base64");

      const result = await uploadFileToDrive(
        accessToken,
        folder.folderId,
        fileName,
        buffer,
        mimeType,
        subfolder
      );

      return NextResponse.json(result);
    }

    if (action === "listFiles") {
      const folder = await createSilverpineFolder(accessToken, orgName);
      const files = await listFiles(accessToken, folder.folderId);
      return NextResponse.json({ files });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in Google Drive API:", error);
    return NextResponse.json(
      { error: "Failed to process Google Drive request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google-drive - Disconnect Google Drive
 */
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Disconnect via Clerk API
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}/oauth_connections/google`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to disconnect Google Drive");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google Drive:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Drive" },
      { status: 500 }
    );
  }
}
