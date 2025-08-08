import Image from "next/image"

interface ProjectLogoProps {
  name: string
  logoUrl?: string
  className?: string
}

export function ProjectLogo({ name, logoUrl, className = "w-8 h-8" }: ProjectLogoProps) {
  // If logoUrl is provided, use the image
  if (logoUrl) {
    return (
      <div className={`${className} rounded-lg overflow-hidden flex items-center justify-center bg-gray-100`}>
        <Image
          src={logoUrl || "/placeholder.svg"}
          alt={`${name} logo`}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Fallback to generated logo with initials
  const getProjectColor = (projectName: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ]
    let hash = 0
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getInitials = (projectName: string) => {
    if (projectName.includes('.')) {
      const parts = projectName.split('.')
      return parts[0].charAt(0).toUpperCase() + (parts[1] ? parts[1].charAt(0).toUpperCase() : '')
    }
    return projectName.charAt(0).toUpperCase() + (projectName.charAt(1) || '').toUpperCase()
  }

  return (
    <div className={`${className} ${getProjectColor(name)} rounded-lg flex items-center justify-center text-white text-sm font-medium`}>
      {getInitials(name)}
    </div>
  )
}
