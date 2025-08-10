"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@better-env/auth/client"
import { useState } from "react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import RedirectToSignIn from "@/components/auth/redirect-to-signin"

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const listQuery = useQuery(trpc.projects.list.queryOptions())

  const session = authClient.useSession();

  if (session.isPending) {
    return <div>Loading...</div>
  }

  if (session.error) {
    return <div>Error: {JSON.stringify(session.error, null, 2)}</div>
  }

  if (!session.data?.user) {
    return <RedirectToSignIn />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader session={session.data?.user || null} />
      <main className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-text-primary text-xl font-medium tracking-tight">My Projects</h2>
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm text-text-secondary hover:text-text-primary underline">Profile</Link>
              <Button onClick={() => setOpen(true)} className="bg-accent-blue text-primary-foreground rounded-lg px-6 py-2.5 text-base hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
          {listQuery.data?.data.length === 0 && (
            <div className="text-text-secondary text-sm font-normal">No projects yet.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listQuery.data?.data.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as unknown as { envCount?: number }).envCount ?? 0}
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
