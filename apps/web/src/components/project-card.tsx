
import { ProjectLogo } from './project-logo'
import { DeviceBubbles } from './device-bubbles'
import { RefreshCWIcon } from './ui/refresh-cw'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

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
  function timeAgo(isoLike: string): string {
    const then = new Date(isoLike).getTime();
    const now = Date.now();
    if (then > now) {
      const futureMs = then - now;
      const years = Math.floor(futureMs / (1000 * 60 * 60 * 24 * 365));
      if (years >= 1) return `Created ${years.toLocaleString()} years ..... in the future?`;
    }
    const diffSec = Math.max(1, Math.floor((now - then) / 1000));
    let val = diffSec;
    let label = "second";
    let i = 0;
    const divisors = [60, 60, 24, 7, 4.2857142857, 12];
    const labels = ["second", "minute", "hour", "day", "week", "month", "year"] as const;
    while (i < divisors.length && val >= divisors[i]) {
      val = Math.floor(val / divisors[i]);
      i++;
    }
    label = labels[i] as string;
    const plural = val === 1 ? "" : "s";
    return `${val} ${label}${plural} ago`;
  }
  return (
    <div className="bg-card border border-border-light rounded-lg p-6 shadow-card hover:shadow-lg hover:border-border-light transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProjectLogo name={name} logoUrl={logoUrl} />
          <h3 className="text-text-primary text-lg font-medium tracking-tight">{name}</h3>
        </div>
        <Tooltip>
                <TooltipTrigger>
                  <RefreshCWIcon size={18} className="w-4 h-4 text-text-tertiary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh '{name}'</p>
                </TooltipContent>
              </Tooltip>        </div>
      
      <div className="flex items-center justify-between mb-4">
        <DeviceBubbles devices={devices} />
      </div>
      
      <div className="flex items-center justify-between text-text-tertiary text-xs">
        <span className="font-normal">{timeAgo(lastSyncTime)}</span>
        <span className="font-normal">{environmentCount} variables</span>
      </div>
    </div>
  )
}
