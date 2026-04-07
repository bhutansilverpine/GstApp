"use client"

import { GoogleDriveConnection } from "./drive-connection"

interface DriveConnectionWrapperProps {
  orgName?: string
}

export function DriveConnectionWrapper({ orgName }: DriveConnectionWrapperProps) {
  return <GoogleDriveConnection orgName={orgName} />
}
