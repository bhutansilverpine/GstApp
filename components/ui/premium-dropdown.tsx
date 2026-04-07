"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Check, ChevronRight, LogOut, Settings, User, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumDropdownProps {
  trigger?: React.ReactNode
  triggerClassName?: string
  align?: "start" | "center" | "end"
}

export function PremiumDropdown({
  trigger,
  triggerClassName = "",
  align = "end",
}: PremiumDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 rounded-full", triggerClassName)}
        >
          {trigger || (
            <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-gray-700">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Avatar" />
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="dropdown-premium">
        <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium">My Account</p>
          <div className="text-xs text-gray-500">user@example.com</div>
        </div>

        <DropdownMenuItem className="gap-3 py-3 px-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Profile</span>
          <DropdownMenuShortcut className="ml-auto text-xs text-muted-foreground">
            ⇧⌘P
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-3 py-3 px-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span>Billing</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-3 py-3 px-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
          <DropdownMenuShortcut className="ml-auto text-xs text-muted-foreground">
            ⌘,
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />

        <DropdownMenuItem className="gap-3 py-3 px-2 text-red-600 dark:text-red-400">
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
          <DropdownMenuShortcut className="ml-auto text-xs">
            ⇧⌘Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
