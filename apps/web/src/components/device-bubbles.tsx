import { Laptop, Monitor } from 'lucide-react'

interface Device {
  name: string
  status: "online" | "offline"
}

interface DeviceBubblesProps {
  devices: Device[]
}

export function DeviceBubbles({ devices }: DeviceBubblesProps) {
  // Sort devices so online devices appear first (on top)
  const sortedDevices = [...devices].sort((a, b) => {
    if (a.status === 'online' && b.status === 'offline') return -1
    if (a.status === 'offline' && b.status === 'online') return 1
    return 0
  })

  return (
    <div className="flex items-center -space-x-2">
      {sortedDevices.map((device, index) => {
        const DeviceIcon = device.name === "macncheese" ? Laptop : Monitor
        const statusColor = device.status === "online" ? "ring-status-online" : "ring-status-offline"
        
        return (
          <div
            key={device.name}
            className={`relative w-8 h-8 bg-card border-2 border-background rounded-full flex items-center justify-center ring-2 ${statusColor} transition-all duration-200 hover:z-10 hover:scale-110`}
            style={{ zIndex: sortedDevices.length - index }}
            title={`${device.name} - ${device.status}`}
          >
            <DeviceIcon className="w-4 h-4 text-text-secondary" />
          </div>
        )
      })}
    </div>
  )
}
