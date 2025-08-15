// Debouncing utility
let lastSelectionTime = 0
const SELECTION_DEBOUNCE_MS = 300

import fs from 'fs'

// Debug logger that writes to file
const debugLog = (message: string) => {
  fs.appendFileSync('/tmp/cli-debug.log', `${new Date().toISOString()} ${message}\n`)
}

export function handleDebouncedSelection(callback: () => void): void {
  const now = Date.now()
  if (now - lastSelectionTime < SELECTION_DEBOUNCE_MS) {
    return // Ignore rapid selections
  }
  lastSelectionTime = now
  callback()
}

// Screen management
export function createScreenManager() {
  let currentScreen = "splash"
  let currentScreenElements: any[] = []
  let focusedSelectElement: any = null
  let parentContainer: any = null

  function setParentContainer(container: any) {
    parentContainer = container
         debugLog("📦 Parent container set for screen manager")
  }

  function setCurrentScreen(screen: string) {
    currentScreen = screen
  }

  function getCurrentScreen() {
    return currentScreen
  }

  function clearScreen() {
         debugLog(`🧹 Clearing screen (${currentScreenElements.length} elements)`)
    if (focusedSelectElement) {
      focusedSelectElement.blur()
      focusedSelectElement = null
    }

    currentScreenElements.forEach((element) => {
      if (element && element.id) {
        try {
          if (parentContainer) {
            parentContainer.remove(element.id)
          }
          element.destroy?.()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    })

    currentScreenElements = []
  }

  function addElement(element: any) {
    if (element) {
             debugLog(`➕ Adding element: ${element.id}`)
      currentScreenElements.push(element)
      if (parentContainer) {
        parentContainer.add(element)
                 debugLog(`✅ Element ${element.id} added to parent container`)
      } else {
                 debugLog(`❌ No parent container to add element ${element.id}`)
      }
    }
  }

  function setFocusedElement(element: any) {
    if (focusedSelectElement && focusedSelectElement !== element) {
      focusedSelectElement.blur()
    }
    focusedSelectElement = element
    if (element && element.focus) {
      element.focus()
    }
  }

  function cleanup() {
    if (focusedSelectElement) {
      focusedSelectElement.destroy()
    }

    currentScreenElements.forEach((element) => {
      if (element && element.destroy) {
        element.destroy()
      }
    })
  }

  return {
    setCurrentScreen,
    getCurrentScreen,
    clearScreen,
    addElement,
    setFocusedElement,
    cleanup,
    setParentContainer,
  }
}

// Mock command implementations
export async function runPull(projectId: string): Promise<void> {
  console.log(`Pulling environment variables from project ${projectId}...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log("Pull completed successfully!")
}

export async function runPush(projectId: string): Promise<void> {
  console.log(`Pushing environment variables to project ${projectId}...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log("Push completed successfully!")
}

export async function runExample(name = "world"): Promise<string> {
  console.log(`Running example command...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log(`Hello, ${name}!`)
  return `Hello, ${name}`
}
