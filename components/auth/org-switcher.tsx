"use client"

import * as React from "react"
import { Building2, ChevronDown, Plus, Settings, Loader2 } from "lucide-react"
import { useAuth, useOrganizationList, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function OrganizationSwitcher() {
  const { user } = useUser()
  const { isLoaded, setActive, organizationList, userMemberships } = useOrganizationList()
  const { organization } = useAuth()

  if (!isLoaded) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  const currentOrg = organization
  const memberships = userMemberships.data || []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 justify-start bg-background hover:bg-accent"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden md:inline truncate max-w-[150px]">
            {currentOrg?.name || "Select Organization"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => setActive({ organization: membership.organization.id })}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">{membership.organization.name}</span>
              <span className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.location.href = "/dashboard/create-org"}>
          <Plus className="mr-2 h-4 w-4" />
          <span>Create organization</span>
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open("https://dashboard.clerk.com", "_blank")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
