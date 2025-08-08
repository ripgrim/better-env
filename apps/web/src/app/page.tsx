"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus, Terminal } from 'lucide-react'
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@better-env/auth/client"
import { useState } from "react"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const listQuery = useQuery(trpc.projects.list.queryOptions())

  const session = authClient.useSession();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader session={session.data?.user || null} />
      <main className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-text-primary text-xl font-medium tracking-tight">My Projects</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-online" />
                <Terminal className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary text-sm font-normal">CLI Online</span>
              </div>
              <Button onClick={() => setOpen(true)} className="bg-accent-blue text-primary-foreground rounded-lg px-6 py-2.5 text-base hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(listQuery.data?.data ?? []).map((p) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as any).envCount ?? 0}
                />
              </Link>
            ))}
          </div>
        </div>
      </main>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
