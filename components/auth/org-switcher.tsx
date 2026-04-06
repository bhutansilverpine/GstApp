"use client"

import * as React from "react"
import { Building2, ChevronDown, Plus, Settings } from "lucide-react"
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 justify-start bg-background hover:bg-accent"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden md:inline">Acme Corp</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Building2 className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Acme Corp</span>
            <span className="text-xs text-muted-foreground">admin@acme.com</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Building2 className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Startup Inc</span>
            <span className="text-xs text-muted-foreground">member@startup.com</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="mr-2 h-4 w-4" />
          <span>Create organization</span>
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
