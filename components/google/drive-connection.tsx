"use client"

import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  FolderOpen,
  Folder,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Link,
  Unlink,
  RefreshCw
} from "lucide-react"

interface DriveInfo {
  connected: boolean
  needsConnection?: boolean
  folderId?: string
  folderUrl?: string
  user?: {
    displayName: string
    emailAddress: string
  }
  error?: string
  message?: string
}

interface GoogleDriveConnectionProps {
  orgName?: string
  onConnect?: () => void
}

export function GoogleDriveConnection({ orgName, onConnect }: GoogleDriveConnectionProps) {
  const { user } = useUser()
  const { isLoaded: authLoaded } = useAuth()
  const [driveInfo, setDriveInfo] = useState<DriveInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  // Check if user signed in with Google
  const signInWithGoogle = user?.externalAccounts?.some(
    (account) => account.provider === "google" as const
  )

  useEffect(() => {
    if (authLoaded) {
      checkDriveConnection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, orgName])

  const checkDriveConnection = async () => {
    try {
      const response = await fetch(`/api/google-drive?orgName=${encodeURIComponent(orgName || "SilverpineGST")}`)
      const data = await response.json()
      setDriveInfo(data)
    } catch (error) {
      console.error("Error checking Drive connection:", error)
      setDriveInfo({ connected: false, error: "Failed to check connection" })
    } finally {
      setLoading(false)
    }
  }

  const handleConnectDrive = async () => {
    setConnecting(true)
    try {
      // Redirect to Clerk's Google OAuth with Drive scopes
      const params = new URLSearchParams({
        redirect_url: window.location.href,
      })

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        redirect_uri: `${window.location.origin}/api/auth/callback/google`,
        response_type: "code",
        scope: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive.readonly",
          "https://www.googleapis.com/auth/spreadsheets.readonly",
        ].join(" "),
        access_type: "offline",
        prompt: "consent",
      })}`
    } catch (error) {
      toast.error("Failed to connect Google Drive")
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/google-drive", { method: "DELETE" })
      if (response.ok) {
        toast.success("Google Drive disconnected")
        setDriveInfo({ connected: false, needsConnection: true })
      }
    } catch (error) {
      toast.error("Failed to disconnect Google Drive")
    }
  }

  const openDriveFolder = () => {
    if (driveInfo?.folderUrl) {
      window.open(driveInfo.folderUrl, "_blank")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // User is signed in with Google but Drive not connected
  if (signInWithGoogle && !driveInfo?.connected) {
    return (
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>Connect Google Drive</CardTitle>
          </div>
          <CardDescription>
            You signed in with Google. Connect your Drive to automatically save receipts and documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Check className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Automatic folder creation</p>
                <p className="text-muted-foreground">We'll create a {orgName || "SilverpineGST"} folder with organized subfolders</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Check className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Seamless sync</p>
                <p className="text-muted-foreground">Upload receipts and they'll be saved to your Drive automatically</p>
              </div>
            </div>
            <Button onClick={handleConnectDrive} className="w-full" disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Google Drive
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // User signed in with other method - show option to connect
  if (!signInWithGoogle && !driveInfo?.connected) {
    return (
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>Connect Cloud Storage</CardTitle>
          </div>
          <CardDescription>
            Connect Google Drive or OneDrive to store your receipts and documents securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button onClick={handleConnectDrive} variant="outline" className="w-full" disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Folder className="h-4 w-4 mr-2" />
                  Connect Google Drive
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Connect OneDrive (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Drive is connected
  if (driveInfo?.connected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-green-600" />
              <CardTitle>Google Drive Connected</CardTitle>
              <Badge variant="secondary" className="ml-2">
                <Check className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {driveInfo.user?.emailAddress || "Your"} Google Drive is connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={openDriveFolder}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Drive Folder
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={checkDriveConnection}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Receipts</Badge>
              <Badge variant="secondary">Bank Statements</Badge>
              <Badge variant="secondary">Invoices</Badge>
              <Badge variant="secondary">Reports</Badge>
              <Badge variant="secondary">Journal Entries</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (driveInfo?.error) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Connection Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{driveInfo.error}</p>
          <Button onClick={checkDriveConnection} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
