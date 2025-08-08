//project env page

'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Eye, EyeOff, Copy, Plus, Check, Terminal, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectLogo } from './project-logo'
import { useRouter } from 'next/navigation'

interface EnvVar {
  key: string
  value: string
  description?: string
  category: string
}

interface ProjectEnvPageProps {
  projectName: string
}

export function ProjectEnvPage({ projectName }: ProjectEnvPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Authentication']))
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const projectId = `${projectName.replace('.', '-')}-${Math.random().toString(36).substr(2, 8)}`

  const handleCopy = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(item)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getEnvVars = (project: string): EnvVar[] => [
    { key: 'DATABASE_URL', value: 'postgresql://user:pass@localhost:5432/mydb', description: 'Primary database connection', category: 'Database' },
    { key: 'REDIS_URL', value: 'redis://localhost:6379', description: 'Cache connection URL', category: 'Database' },
    { key: 'JWT_SECRET', value: 'super-secret-jwt-signing-key-2024', description: 'Token signing secret', category: 'Authentication' },
    { key: 'API_KEY', value: 'sk-1234567890abcdef1234567890abcdef', description: 'Third-party API key', category: 'Authentication' },
    { key: 'OAUTH_CLIENT_SECRET', value: 'oauth_secret_1234567890abcdef', description: 'OAuth client secret', category: 'Authentication' },
    { key: 'STRIPE_SECRET_KEY', value: 'sk_test_1234567890abcdef1234567890abcdef', description: 'Payment processing key', category: 'Payment' },
    { key: 'SENDGRID_API_KEY', value: 'SG.1234567890abcdef.1234567890abcdef', description: 'Email service API key', category: 'External Services' },
    { key: 'AWS_ACCESS_KEY_ID', value: 'AKIA1234567890ABCDEF', description: 'AWS access key', category: 'External Services' },
    { key: 'AWS_SECRET_ACCESS_KEY', value: 'abcdef1234567890abcdef1234567890abcdef12', description: 'AWS secret key', category: 'External Services' },
    { key: 'NEXT_PUBLIC_APP_URL', value: 'https://myapp.com', description: 'Public application URL', category: 'Configuration' },
    { key: 'WEBHOOK_SECRET', value: 'whsec_1234567890abcdef1234567890abcdef', description: 'Webhook verification secret', category: 'Configuration' },
    { key: 'ENCRYPTION_KEY', value: 'enc_1234567890abcdef1234567890abcdef', description: 'Data encryption key', category: 'Security' }
  ]

  const envVars = getEnvVars(projectName)
  const filteredVars = envVars.filter(envVar => 
    envVar.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envVar.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedVars = filteredVars.reduce((acc, envVar) => {
    if (!acc[envVar.category]) acc[envVar.category] = []
    acc[envVar.category].push(envVar)
    return acc
  }, {} as Record<string, EnvVar[]>)

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedGroups(newExpanded)
  }

  const getProjectLogo = (name: string) => {
    const logoUrls: Record<string, string> = {
      'oss.now': 'https://cdn.discordapp.com/attachments/915489116970418186/1402974394170478653/ossdotnow.png?ex=6895dd39&is=68948bb9&hm=7e9ea7f51b39b81d4a9c31e1f6de3c2d8d26aa8a90c9b8f212569803f1e80173&',
      'bounty.new': 'https://cdn.discordapp.com/attachments/915489116970418186/1402974642636980345/bountydark.png?ex=6895dd74&is=68948bf4&hm=86338a50a3694509cb3d35dcee12c8464cc5bf6cc34a65cfc4ef2d67d5ae031e&',
      'mail0': 'https://cdn.discordapp.com/attachments/915489116970418186/1402974643169661082/mail0dark.png?ex=6895dd74&is=68948bf4&hm=0e1c0fd8e4b9db4de86ee698b6c140a7cc969206de61a9e89c7be1988fccd22c&',
      'analog.now': 'https://cdn.discordapp.com/attachments/915489116970418186/1402975302946394152/analogdotballs.png?ex=6895de12&is=68948c92&hm=d9bfe24d174d7084cc8e996be1ab912b6b7603fba9f2af4027692bbfcb8f7601&',
      'call0': 'https://cdn.discordapp.com/attachments/915489116970418186/1402974642926522378/call0jawn.png?ex=6895dd74&is=68948bf4&hm=691be61ce125af91089a76b7dccdf211b85c69d7afa5787916ec70853a211d2e&',
    }
    return logoUrls[name] || ''
  }

  const maskValue = (value: string) => {
    if (value.length <= 8) return '•'.repeat(value.length)
    return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 12)) + value.substring(value.length - 4)
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
              <ProjectLogo name={projectName} logoUrl={getProjectLogo(projectName)} className="w-7 h-7" />
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
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm px-3 py-2"
            >
              {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAll ? 'Hide' : 'Show'} All
            </Button>
            <Button className="bg-accent-blue text-primary-foreground rounded-lg px-4 py-2 text-sm hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* CLI Command Box */}
          <div className="bg-card border border-border-light rounded-lg p-5 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-accent-blue" />
                <h2 className="text-text-primary font-medium text-base">CLI Access</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-text-secondary text-sm font-medium min-w-20">Project ID:</span>
                <div className="flex items-center gap-2 flex-1">
                  <code className="bg-secondary px-3 py-1.5 rounded-md text-sm font-mono text-text-primary flex-1">{projectId}</code>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => handleCopy(projectId, 'project-id')}
                    className="p-1.5 h-auto hover:bg-accent"
                  >
                    {copiedItem === 'project-id' ? <Check className="w-4 h-4 text-status-online" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-text-secondary text-sm font-medium min-w-20">Pull Command:</span>
                <div className="flex items-center gap-2 flex-1">
                  <code className="bg-secondary px-3 py-1.5 rounded-md text-sm font-mono text-text-primary flex-1">
                    npx env-new@latest pull {projectId}
                  </code>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => handleCopy(`npx env-new@latest pull ${projectId}`, 'pull-command')}
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
    </div>
  )
}

interface EnvVarRowProps {
  envVar: EnvVar
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
            className={`font-mono text-xs p-2 rounded border transition-all duration-300 cursor-pointer ${
              shouldShow 
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
