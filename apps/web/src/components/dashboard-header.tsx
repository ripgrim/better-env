import Image from "next/image"
import { Link, Search } from 'lucide-react'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User } from "better-auth"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu"

export function DashboardHeader({ session }: { session: User | null }) {
  return (
    <header className="bg-card border-b border-border-subtle px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-10 pr-4 py-2.5 text-base rounded-lg border border-border-light bg-card text-text-primary placeholder:text-text-tertiary focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-input-focus focus-visible:border-accent-blue transition-all duration-200"
          />
        </div>
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Image
                src={session.image || "/placeholder.svg?height=32&width=32"}
                width={32}
                height={32}
                alt="User Avatar"
                className="rounded-full"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Button variant="text" className="text-text-secondary text-sm px-3 py-2 h-auto hover:bg-accent hover:text-text-primary transition-colors duration-200 font-normal">
                  Profile
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button variant="text" className="text-text-secondary text-sm px-3 py-2 h-auto hover:bg-accent hover:text-text-primary transition-colors duration-200 font-normal">
                  Sign out
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
