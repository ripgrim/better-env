"use client"

import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { authClient } from "@better-env/auth/client"
import { useKeybindActions } from "@/components/keybinds-provider"
import RedirectToSignIn from "@/components/auth/redirect-to-signin"
import { Spinner } from "@/components/ui/spinner"
import { ProjectsList } from "@/components/projects-list"
import { RefreshCWIcon } from '@/components/ui/refresh-cw'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function DashboardPage() {
  const actions = useKeybindActions()

  const session = authClient.useSession();

  if (session.isPending) {
    return <div className="flex h-screen items-center justify-center"><Spinner size={24} /></div>
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
            <h2 className="text-text-primary text-xl font-medium tracking-tight flex flex-row items-center gap-2">
              My Projects
              <Tooltip>
                <TooltipTrigger>
                  <RefreshCWIcon size={18} className="w-4 h-4 text-text-tertiary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh projects</p>
                </TooltipContent>
              </Tooltip>
            </h2>
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm text-text-secondary hover:text-text-primary underline">Profile</Link>
              <Button data-keybind-action="openNewProject" onClick={() => actions.openNewProject()} className="bg-accent-blue text-primary-foreground rounded-lg px-6 py-2.5 text-base hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
                <Plus className="w-4 h-4" />
                New Project
                  <div className="flex h-5 items-center justify-center gap-2.5 rounded bg-[#0061ca] px-1 outline-1 -outline-offset-1 outline-[#1a6fcc]"><div className="text-tokens-shortcut-primary-symbol justify-start text-center text-sm font-semibold leading-none">
                  ⇧N
                  </div>
                </div>
              </Button>
            </div>
          </div>
          <ProjectsList />
        </div>
      </main>

    </div>
  )
}
