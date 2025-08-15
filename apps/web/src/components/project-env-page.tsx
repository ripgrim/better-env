//project env page

"use client"

import { useMemo, useState } from 'react'
import { ArrowLeft, Search, Eye, EyeOff, Copy, Plus, Check, Terminal, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectLogo } from './project-logo'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'
import { useQuery } from '@tanstack/react-query'
import { AddEnvDialog } from "@/components/dialogs/add-env-dialog"
import { Spinner } from "@/components/ui/spinner"
import { classifyEnvVar, type EnvCategory } from '@/lib/env-classifier'
import type { Project, EnvVar as CoreEnvVar } from '@/types'

type DisplayEnvVar = CoreEnvVar & { category: string }

interface ProjectEnvPageProps {
  projectId: string
}

export function ProjectEnvPage({ projectId }: ProjectEnvPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Authentication']))
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [runner, setRunner] = useState<'npx' | 'pnpm' | 'bunx'>('npx')

  const projectQuery = useQuery(trpc.projects.get.queryOptions({ id: projectId }))
  const project = projectQuery.data?.data as Project | undefined

  const handleCopy = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(item)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const envVars: DisplayEnvVar[] = useMemo(() => {
    if (!project || !Array.isArray(project.envs)) return []
    return (project.envs as CoreEnvVar[]).map(({ key, value, environmentName }) => {
      const category = mapCategory(classifyEnvVar(key, value))
      const displayKey = environmentName && environmentName.toLowerCase().startsWith('prod') ? key : environmentName ? `${environmentName}.${key}` : key
      return { key: displayKey, value, description: undefined, category }
    })
  }, [project])

  function mapCategory(cat: EnvCategory): string {
    switch (cat) {
      case 'Storage':
        return 'Storage'
      case 'Authentication':
        return 'Authentication'
      case 'Payments':
        return 'Payments'
      case 'Configuration':
        return 'Configuration'
      case 'Analytics':
        return 'Analytics'
      case 'External':
        return 'External'
      default:
        return 'Misc'
    }
  }
  const filteredVars = envVars.filter(envVar =>
    envVar.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envVar.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedVars = filteredVars.reduce((acc, envVar) => {
    if (!acc[envVar.category]) acc[envVar.category] = []
    acc[envVar.category].push(envVar)
    return acc
  }, {} as Record<string, DisplayEnvVar[]>)

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedGroups(newExpanded)
  }

  const projectName = project?.name || projectId
  const projectLogo = (project as unknown as { logoUrl?: string })?.logoUrl ?? ''

  const maskValue = (value: string) => {
    if (value.length <= 8) return '•'.repeat(value.length)
    return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 12)) + value.substring(value.length - 4)
  }

  if (projectQuery.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (projectQuery.error) {
    return (
      <div className="flex h-svh items-center justify-center text-red-500 text-sm">
        Failed to load project
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border-subtle px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="text" className="p-2 hover:bg-accent">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <ProjectLogo name={projectName} logoUrl={projectLogo} className="w-7 h-7" />
              <div>
                <h1 className="text-text-primary text-lg font-medium tracking-tight">{projectName}</h1>
                <p className="text-text-secondary text-xs">Environment Variables</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                type="search"
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm rounded-lg border border-border-light bg-card text-text-primary placeholder:text-text-tertiary focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-input-focus focus-visible:border-accent-blue transition-all duration-200"
              />
            </div>
            <Button
              variant="text"
              data-keybind-action="hideEnvVars"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm px-3 py-2"
            >
              {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAll ? 'Hide' : 'Show'} All
            </Button>
            <Button data-keybind-action="addEnvs" onClick={() => setOpenAdd(true)} className="bg-accent-blue text-primary-foreground rounded-lg px-4 py-2 text-sm hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
              <div className="flex h-5 items-center justify-center gap-2.5 rounded bg-[#0061ca] px-1 outline-1 -outline-offset-1 outline-[#1a6fcc]"><div className="text-tokens-shortcut-primary-symbol justify-start text-center text-sm font-semibold leading-none">
                ⇧A
              </div>
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* CLI Command Box */}
          <div className="bg-card border border-border-light rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-accent-blue" />
                <h2 className="text-text-primary font-medium text-base">Pull envs with CLI</h2>
              </div>
              <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
                <Button
                  variant="text"
                  size="sm"
                  className={`${runner === 'npx' ? 'bg-accent-blue text-primary-foreground' : 'text-text-secondary hover:text-text-primary'} px-2 py-1 rounded`}
                  onClick={() => setRunner('npx')}
                >
                  npx
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  className={`${runner === 'pnpm' ? 'bg-accent-blue text-primary-foreground' : 'text-text-secondary hover:text-text-primary'} px-2 py-1 rounded`}
                  onClick={() => setRunner('pnpm')}
                >
                  pnpm dlx
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  className={`${runner === 'bunx' ? 'bg-accent-blue text-primary-foreground' : 'text-text-secondary hover:text-text-primary'} px-2 py-1 rounded`}
                  onClick={() => setRunner('bunx')}
                >
                  bunx
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-text-secondary text-sm font-medium min-w-20">Project ID</span>
                <div className="flex items-center gap-2 flex-1">
                  <code className="bg-secondary px-3 py-1.5 rounded-md text-sm font-mono text-text-primary flex-1 overflow-x-auto">{project?.id}</code>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => handleCopy(project?.id ?? '', 'project-id')}
                    className="p-1.5 h-auto hover:bg-accent"
                  >
                    {copiedItem === 'project-id' ? <Check className="w-4 h-4 text-status-online" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-text-secondary text-sm font-medium min-w-20">Run this command</span>
                <div className="flex items-center gap-2 flex-1">
                  <code className="bg-secondary px-3 py-1.5 rounded-md text-sm font-mono text-text-primary flex-1 overflow-x-auto">
                    {runner === 'npx' && `npx @better-env/cli@latest pull ${project?.id ?? ''}`}
                    {runner === 'pnpm' && `pnpm dlx @better-env/cli@latest pull ${project?.id ?? ''}`}
                    {runner === 'bunx' && `bunx @better-env/cli@latest pull ${project?.id ?? ''}`}
                  </code>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => {
                      const cmd = runner === 'npx'
                        ? `npx @better-env/cli@latest pull ${project?.id ?? ''}`
                        : runner === 'pnpm'
                          ? `pnpm dlx @better-env/cli@latest pull ${project?.id ?? ''}`
                          : `bunx @better-env/cli@latest pull ${project?.id ?? ''}`
                      handleCopy(cmd, 'pull-command')
                    }}
                    className="p-1.5 h-auto hover:bg-accent"
                  >
                    {copiedItem === 'pull-command' ? <Check className="w-4 h-4 text-status-online" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables by Category */}
          <div className="space-y-3">
            {Object.entries(groupedVars).map(([category, vars]) => {
              const isExpanded = expandedGroups.has(category)
              return (
                <div key={category} className="bg-card border border-border-light rounded-lg shadow-card overflow-hidden">
                  <button
                    onClick={() => toggleGroup(category)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-accent transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
                      <h3 className="text-text-primary font-medium text-sm">{category}</h3>
                      <span className="text-text-tertiary text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {vars.length}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-subtle">
                      {vars.map((envVar, index) => (
                        <EnvVarRow
                          key={envVar.key}
                          envVar={envVar}
                          forceShow={showAll}
                          isLast={index === vars.length - 1}
                          onCopy={handleCopy}
                          copiedItem={copiedItem}
                          maskValue={maskValue}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {Object.keys(groupedVars).length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No environment variables found matching your search.</p>
            </div>
          )}
        </div>
      </main>
      <AddEnvDialog projectId={projectId} open={openAdd} onOpenChange={setOpenAdd} />
    </div>
  )
}

interface EnvVarRowProps {
  envVar: DisplayEnvVar
  forceShow: boolean
  isLast: boolean
  onCopy: (text: string, item: string) => void
  copiedItem: string | null
  maskValue: (value: string) => string
}

function EnvVarRow({ envVar, forceShow, isLast, onCopy, copiedItem, maskValue }: EnvVarRowProps) {
  const [isVisible, setIsVisible] = useState(false)
  const shouldShow = forceShow || isVisible

  return (
    <div className={`px-5 py-3 hover:bg-accent transition-colors duration-200 group ${!isLast ? 'border-b border-border-subtle' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-text-primary font-medium text-sm">{envVar.key}</h4>
            <Button
              variant="text"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-auto hover:bg-background"
            >
              {shouldShow ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-text-secondary text-xs mb-2">{envVar.description}</p>
          <div
            className={`font-mono text-xs p-2 rounded border transition-all duration-300 cursor-pointer ${shouldShow
              ? 'bg-secondary border-border-light text-text-primary'
              : 'bg-accent border-border-subtle text-text-secondary hover:bg-secondary'
              }`}
            onClick={() => !forceShow && setIsVisible(!isVisible)}
          >
            {shouldShow ? envVar.value : maskValue(envVar.value)}
          </div>
        </div>

        {shouldShow && (
          <Button
            variant="text"
            size="sm"
            onClick={() => onCopy(envVar.value, envVar.key)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 h-auto hover:bg-background"
          >
            {copiedItem === envVar.key ? <Check className="w-4 h-4 text-status-online" /> : <Copy className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  )
}
