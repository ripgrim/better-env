import { Search } from 'lucide-react'

import { Input } from "@/components/ui/input"
import { User } from "better-auth"
import UserMenu from "./user-menu"
import Link from "next/link"

const navigationLinks = [
  { href: "/", label: "Home" },
];

export function DashboardHeader({ session }: { session: User | null }) {
  return (
    <header className="bg-card border-b border-border-subtle px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {navigationLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-72 flex items-center gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2.5 text-base rounded-lg border border-border-light bg-card text-text-primary placeholder:text-text-tertiary focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-input-focus focus-visible:border-accent-blue transition-all duration-200"
            />
          </div>
          {session && (
            <UserMenu />
          )}
        </div>
      </div>
    </header>
  )
}
