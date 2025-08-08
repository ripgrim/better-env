import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus, Terminal } from 'lucide-react'

export default function DashboardPage() {
  const projects = [
    {
      name: "oss.now",
      logoUrl: "https://cdn.discordapp.com/attachments/915489116970418186/1402974394170478653/ossdotnow.png?ex=6895dd39&is=68948bb9&hm=7e9ea7f51b39b81d4a9c31e1f6de3c2d8d26aa8a90c9b8f212569803f1e80173&",
      devices: [
        { name: "macncheese", status: "online" as const },
        { name: "grim's desktop", status: "offline" as const },
      ],
      lastSyncTime: "2 minutes ago",
      environmentCount: 12,
    },
    {
      name: "bounty.new",
      logoUrl: "https://cdn.discordapp.com/attachments/915489116970418186/1402974642636980345/bountydark.png?ex=6895dd74&is=68948bf4&hm=86338a50a3694509cb3d35dcee12c8464cc5bf6cc34a65cfc4ef2d67d5ae031e&",
      devices: [
        { name: "grim's desktop", status: "online" as const },
        { name: "macncheese", status: "offline" as const },
      ],
      lastSyncTime: "1 hour ago",
      environmentCount: 8,
    },
    {
      name: "mail0",
      logoUrl: "https://cdn.discordapp.com/attachments/915489116970418186/1402974643169661082/mail0dark.png?ex=6895dd74&is=68948bf4&hm=0e1c0fd8e4b9db4de86ee698b6c140a7cc969206de61a9e89c7be1988fccd22c&",
      devices: [
        { name: "macncheese", status: "online" as const },
        { name: "grim's desktop", status: "offline" as const },
      ],
      lastSyncTime: "5 hours ago",
      environmentCount: 5,
    },
    {
      name: "analog.now",
      logoUrl: "https://cdn.discordapp.com/attachments/915489116970418186/1402975302946394152/analogdotballs.png?ex=6895de12&is=68948c92&hm=d9bfe24d174d7084cc8e996be1ab912b6b7603fba9f2af4027692bbfcb8f7601&",
      devices: [
        { name: "grim's desktop", status: "online" as const },
        { name: "macncheese", status: "offline" as const },
      ],
      lastSyncTime: "1 day ago",
      environmentCount: 20,
    },
    {
      name: "call0",
      logoUrl: "https://cdn.discordapp.com/attachments/915489116970418186/1402974642926522378/call0jawn.png?ex=6895dd74&is=68948bf4&hm=691be61ce125af91089a76b7dccdf211b85c69d7afa5787916ec70853a211d2e&",
      devices: [
        { name: "macncheese", status: "online" as const },
        { name: "grim's desktop", status: "offline" as const },
      ],
      lastSyncTime: "3 days ago",
      environmentCount: 7,
    },
    {
      name: "env.new",
      logoUrl: "",
      devices: [
        { name: "grim's desktop", status: "online" as const },
        { name: "macncheese", status: "offline" as const },
      ],
      lastSyncTime: "1 week ago",
      environmentCount: 15,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
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
              <Button className="bg-accent-blue text-primary-foreground rounded-lg px-6 py-2.5 text-base hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.name} href={`/project/${project.name}`}>
                <ProjectCard {...project} />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
