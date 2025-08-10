"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
// import { SidebarTrigger } from "@/components/ui/sidebar";



const navigationLinks = [
  { href: "/", label: "Home" },
];

export function Header() {
  // const health = useQuery(trpc.healthCheck.queryOptions());


  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 sm:px-6"
      )}
    >
      <div className="flex items-center gap-6">
        {/* <SidebarTrigger /> */}
        <nav className="flex items-center">
          <div className="flex items-center gap-6">
            {navigationLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
