'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Edit3 } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface EnvVar {
  key: string
  value: string
  description?: string
}

interface EnvVarCardProps {
  envVar: EnvVar
  forceShow?: boolean
}

export function EnvVarCard({ envVar, forceShow = false }: EnvVarCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const shouldShow = forceShow || isVisible

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const maskValue = (value: string) => {
    if (value.length <= 8) return '•'.repeat(value.length)
    return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.substring(value.length - 4)
  }

  return (
    <div className="bg-card border border-border-light rounded-lg p-4 shadow-card hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-text-primary font-medium text-base tracking-tight">{envVar.key}</h3>
            <Button
              variant="text"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-auto hover:bg-accent"
            >
              {shouldShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {envVar.description && (
            <p className="text-text-secondary text-sm mb-3">{envVar.description}</p>
          )}
          
          <div className="relative">
            <div 
              className={`font-mono text-sm p-3 rounded-md border transition-all duration-300 cursor-pointer ${
                shouldShow 
                  ? 'bg-secondary border-border-light text-text-primary' 
                  : 'bg-accent border-border-subtle text-text-secondary hover:bg-secondary'
              }`}
              onClick={() => !forceShow && setIsVisible(!isVisible)}
            >
              {shouldShow ? envVar.value : maskValue(envVar.value)}
            </div>
            
            {shouldShow && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => handleCopy(envVar.value)}
                  className="p-1 h-auto hover:bg-background"
                >
                  {copied ? <Check className="w-4 h-4 text-status-online" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="text"
            size="sm"
            className="p-2 h-auto hover:bg-accent"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
