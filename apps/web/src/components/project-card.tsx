import { RefreshCw } from 'lucide-react'
import { ProjectLogo } from './project-logo'
import { DeviceBubbles } from './device-bubbles'

interface Device {
  name: string
  status: "online" | "offline"
}

interface ProjectCardProps {
  name: string
  logoUrl?: string
  devices: Device[]
  lastSyncTime: string
  environmentCount: number
}

export function ProjectCard({
  name,
  logoUrl,
  devices,
  lastSyncTime,
  environmentCount,
}: ProjectCardProps) {
  return (
    <div className="bg-card border border-border-light rounded-lg p-6 shadow-card hover:shadow-lg hover:border-border-light transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProjectLogo name={name} logoUrl={logoUrl} />
          <h3 className="text-text-primary text-lg font-medium tracking-tight">{name}</h3>
        </div>
        <RefreshCw className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary transition-colors duration-200" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <DeviceBubbles devices={devices} />
      </div>
      
      <div className="flex items-center justify-between text-text-tertiary text-xs">
        <span className="font-normal">{lastSyncTime}</span>
        <span className="font-normal">{environmentCount} variables</span>
      </div>
    </div>
  )
}
