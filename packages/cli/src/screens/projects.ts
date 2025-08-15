import { CliRenderer, SelectRenderableEvents, type SelectOption } from "@opentui/core"
import { createBox, createText, createSelect, centerX, colors, controlsText as controlsHelpText } from "../ui/ui"
import { apiClient } from "../lib/trpc-client"
import fs from 'fs'

// Debug logger that writes to file
const debugLog = (message: string) => {
  fs.appendFileSync('/tmp/cli-debug.log', `${new Date().toISOString()} ${message}\n`)
}

export interface ProjectScreens {
  showProjects: () => Promise<void>
  showCreateProject: () => void
  showProjectDetails: (projectId: string) => Promise<void>
  showProjectEnvVars: (projectId: string) => Promise<void>
  showPullEnv: () => Promise<void>
  showPullConfirm: (projectId: string) => Promise<void>
  showPushEnv: () => Promise<void>
  showPushVarSelection: (projectId: string) => void
  showPushConfirm: (projectId: string, varKey: string) => void
  showEnvVarDetails: (projectId: string, envVar: any) => void
}

// All functionality now uses real API data instead of mock data

export function createProjectScreens(
  renderer: CliRenderer,
  parentContainer: any,
  addElement: (element: any) => void,
  clearScreen: () => void,
  setCurrentScreen: (screen: string) => void,
  handleDebouncedSelection: (callback: () => void) => void,
  showMainMenu: () => void,
  runPull: (projectId: string) => Promise<void>,
  runPush: (projectId: string) => Promise<void>
): ProjectScreens {

  async function showProjects() {
    debugLog("📋 Showing projects screen...")
    clearScreen()
    setCurrentScreen("projects")

    if (!parentContainer) return

    const titleBox = createBox(
      "projects-title",
      "Your Projects",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading projects...",
      { left: centerX(renderer, 20), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      debugLog("🌐 Fetching projects from API...")
      const response = await apiClient.listProjects()
      debugLog(`📦 Projects response: ${JSON.stringify({ success: response.success, count: response.data?.personal.length || 0 })}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (response.success && response.data) {
        const projects = response.data.personal
        debugLog(`✅ Got ${projects.length} projects`)

        if (projects.length === 0) {
          const noProjectsText = createText(
            "no-projects-text",
            "No projects found. Create your first project!",
            { left: centerX(renderer, 45), top: 12 },
            { fg: colors.muted }
          )
          addElement(noProjectsText)

          const createHint = createText(
            "create-hint",
            "Press 'c' to create a new project or Escape to go back",
            { left: centerX(renderer, 50), top: 14 },
            { fg: colors.secondary }
          )
          addElement(createHint)
          return
        }

        const projectOptions: SelectOption[] = projects.map(project => ({
          name: project.name,
          description: `${project.envCount} environment variables`,
          value: project.id,
        }))

        const projectSelect = createSelect(
          "projects-list",
          projectOptions,
          { left: centerX(renderer, 76), top: 8 },
          { width: 76, height: 12 }
        )

        projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
          handleDebouncedSelection(async () => {
            await showProjectDetails(option.value as string)
          })
        })

        addElement(projectSelect)

        const controlsTextElement = createText(
          "controls-text",
          controlsHelpText,
          { left: centerX(renderer, 40), top: 22 },
          { fg: colors.muted }
        )
        addElement(controlsTextElement)

        // Auto-focus
        setTimeout(() => {
          if (projectSelect) {
            projectSelect.focus()
          }
        }, 100)

      } else {
        debugLog("❌ Failed to fetch projects")
        const errorText = createText(
          "error-text",
          "Failed to load projects. Check your connection.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
      }
    } catch (error) {
      debugLog(`❌ Error fetching projects: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading projects. Please try again.",
        { left: centerX(renderer, 40), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  function showCreateProject() {
    clearScreen()
    setCurrentScreen("create-project")

    if (!parentContainer) return

    const titleBox = createBox(
      "create-title",
      "Create New Project",
      { left: centerX(renderer, 80), top: 8 },
      { width: 80, height: 8 }
    )
    addElement(titleBox)

    const instructionText = createText(
      "create-instruction",
      "This feature will be available soon. Use the web interface at http://localhost:3000",
      { left: centerX(renderer, 70), top: 12 },
      { fg: colors.secondary }
    )
    addElement(instructionText)

    const backText = createText(
      "create-back",
      "Press 'Esc' or 'Backspace' to go back to main menu",
      { left: centerX(renderer, 45), top: 16 },
      { fg: colors.muted }
    )
    addElement(backText)
  }

  async function showProjectDetails(projectId: string) {
    debugLog(`🔍 Showing project details for ID: ${projectId}`)
    clearScreen()
    setCurrentScreen(`project-details-${projectId}`)

    if (!parentContainer) {
      debugLog("❌ No parent container for project details")
      return
    }

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading project details...",
      { left: centerX(renderer, 25), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      // Fetch project details from API
      debugLog("🌐 Fetching project details from API...")
      const response = await apiClient.getProject(projectId)
      debugLog(`📦 Project details response: ${JSON.stringify({ success: response.success, hasData: !!response.data })}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data) {
        debugLog("❌ Failed to fetch project details")
        const errorText = createText(
          "error-text",
          "Failed to load project details. Please try again.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const project = response.data
      debugLog(`✅ Project details loaded: ${project.name}`)

      const titleBox = createBox(
        "project-details-title",
        `Project: ${project.name}`,
        { left: centerX(renderer, 80), top: 6 },
        { width: 80, height: 3 }
      )
      addElement(titleBox)

      const detailsText = createText(
        "project-details-info",
        `ID: ${project.id}\nName: ${project.name}\nEnvironment Variables: ${project.envs?.length || 0}`,
        { left: centerX(renderer, 76), top: 10 },
        { fg: colors.secondary }
      )
      addElement(detailsText)

      const actionOptions: SelectOption[] = [
        { name: "View Environment Variables", description: "Browse all env vars for this project", value: "envvars" },
        { name: "Back to Projects", description: "Return to projects list", value: "back" },
      ]

      const actionSelect = createSelect(
        "project-actions",
        actionOptions,
        { left: centerX(renderer, 76), top: 18 },
        { width: 76, height: 2 }
      )

      actionSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          if (option.value === "envvars") {
            await showProjectEnvVars(projectId)
          } else if (option.value === "back") {
            await showProjects()
          }
        })
      })

      addElement(actionSelect)

      // Auto-focus
      setTimeout(() => {
        if (actionSelect) {
          actionSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error fetching project details: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading project details. Please try again.",
        { left: centerX(renderer, 45), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
      return
    }
  }

  async function showProjectEnvVars(projectId: string) {
    debugLog(`🔧 Showing environment variables for project: ${projectId}`)
    clearScreen()
    setCurrentScreen(`project-envvars-${projectId}`)

    if (!parentContainer) {
      debugLog("❌ No parent container for env vars")
      return
    }

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading environment variables...",
      { left: centerX(renderer, 35), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      // Fetch project details with environment variables
      debugLog("🌐 Fetching project details for env vars...")
      const response = await apiClient.getProject(projectId)
      debugLog(`📦 Env vars response: ${JSON.stringify({ success: response.success, envCount: response.data?.envs?.length || 0 })}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data) {
        debugLog("❌ Failed to fetch project env vars")
        const errorText = createText(
          "error-text",
          "Failed to load environment variables. Please try again.",
          { left: centerX(renderer, 50), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const project = response.data
      debugLog(`✅ Project env vars loaded: ${project.envs?.length || 0} variables`)

      const titleBox = createBox(
        "envvars-title",
        `Environment Variables - ${project.name}`,
        { left: centerX(renderer, 80), top: 6 },
        { width: 80, height: 3 }
      )
      addElement(titleBox)

      if (!project.envs || project.envs.length === 0) {
        const noEnvText = createText(
          "no-env-text",
          "No environment variables found for this project.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.muted }
        )
        addElement(noEnvText)

        const backHint = createText(
          "back-hint",
          "Press Escape to go back to project details",
          { left: centerX(renderer, 40), top: 14 },
          { fg: colors.secondary }
        )
        addElement(backHint)
        return
      }

      const envOptions: SelectOption[] = project.envs.map(envVar => ({
        name: envVar.key,
        description: `${envVar.environmentName}: ${envVar.value.substring(0, 30)}...`,
        value: envVar.id,
      }))

      const envSelect = createSelect(
        "env-list",
        envOptions,
        { left: centerX(renderer, 76), top: 8 },
        { width: 76, height: 12 }
      )

      envSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
        handleDebouncedSelection(() => {
          const envVar = project.envs?.find(e => e.id === option.value)
          if (envVar) {
            showEnvVarDetails(projectId, envVar)
          }
        })
      })

      addElement(envSelect)

      const controlsTextElement = createText(
        "controls-text",
        controlsHelpText,
        { left: centerX(renderer, 40), top: 22 },
        { fg: colors.muted }
      )
      addElement(controlsTextElement)

      // Auto-focus
      setTimeout(() => {
        if (envSelect) {
          envSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error fetching project env vars: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading environment variables. Please try again.",
        { left: centerX(renderer, 50), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  function showEnvVarDetails(projectId: string, envVar: any) {
    debugLog(`🔍 Showing env var details: ${envVar.key}`)
    clearScreen()
    setCurrentScreen("env-var-details")

    if (!envVar || !parentContainer) {
      debugLog("❌ No env var or parent container")
      return
    }

    const titleBox = createBox(
      "env-detail-title",
      `Environment Variable: ${envVar.key}`,
      { left: centerX(renderer, 80), top: 8 },
      { width: 80, height: 10 }
    )
    addElement(titleBox)

    // Show environment variable details
    const detailsText = createText(
      "env-details",
      `Key: ${envVar.key}\nValue: ${envVar.value}\nEnvironment: ${envVar.environmentName || 'default'}\nDescription: ${envVar.description || 'No description'}\nCreated: ${new Date(envVar.createdAt).toLocaleDateString()}`,
      { left: centerX(renderer, 76), top: 12 },
      { fg: colors.secondary }
    )
    addElement(detailsText)

    const actionOptions: SelectOption[] = [
      { name: "Copy Value", description: "Copy the environment variable value to clipboard", value: "copy" },
      { name: "Back to Environment Variables", description: "Return to environment variables list", value: "back" },
    ]

    const actionSelect = createSelect(
      "env-actions",
      actionOptions,
      { left: centerX(renderer, 76), top: 19 },
      { width: 76, height: 2 }
    )

    actionSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
      handleDebouncedSelection(async () => {
        if (option.value === "copy") {
          // Copy to clipboard
          try {
            if (process.platform === "darwin") {
              require("child_process").execSync(`echo "${envVar.value}" | pbcopy`)
            } else if (process.platform === "win32") {
              require("child_process").execSync(`echo "${envVar.value}" | clip`)
            } else {
              // Linux
              require("child_process").execSync(`echo "${envVar.value}" | xclip -selection clipboard`)
            }
            
            // Show success message briefly
            const successText = createText(
              "copy-success",
              "✅ Value copied to clipboard!",
              { left: centerX(renderer, 30), top: 23 },
              { fg: colors.success }
            )
            addElement(successText)
            
            setTimeout(() => {
              if (parentContainer) {
                parentContainer.remove("copy-success")
              }
            }, 2000)
          } catch (error) {
            debugLog(`❌ Error copying to clipboard: ${error}`)
            const errorText = createText(
              "copy-error",
              "❌ Failed to copy to clipboard",
              { left: centerX(renderer, 30), top: 23 },
              { fg: colors.error }
            )
            addElement(errorText)
            
            setTimeout(() => {
              if (parentContainer) {
                parentContainer.remove("copy-error")
              }
            }, 2000)
          }
        } else if (option.value === "back") {
          await showProjectEnvVars(projectId)
        }
      })
    })

    addElement(actionSelect)

    // Auto-focus
    setTimeout(() => {
      if (actionSelect) {
        actionSelect.focus()
      }
    }, 100)
  }

  async function showPullEnv() {
    debugLog("📥 Showing pull environment variables screen...")
    clearScreen()
    setCurrentScreen("pull-env")

    if (!parentContainer) return

    const titleBox = createBox(
      "pull-title",
      "Pull Environment Variables",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const instructionText = createText(
      "pull-instruction",
      "Select a project to pull environment variables from:",
      { left: centerX(renderer, 50), top: 10 },
      { fg: colors.secondary }
    )
    addElement(instructionText)

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading projects...",
      { left: centerX(renderer, 20), top: 14 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      debugLog("🌐 Fetching projects for pull...")
      const response = await apiClient.listProjects()
      debugLog(`📦 Pull projects response: ${JSON.stringify({ success: response.success, count: response.data?.personal.length || 0 })}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data || response.data.personal.length === 0) {
        debugLog("❌ No projects available for pull")
        const noProjectsText = createText(
          "no-projects-text",
          "No projects available to pull from.",
          { left: centerX(renderer, 35), top: 14 },
          { fg: colors.muted }
        )
        addElement(noProjectsText)

        const backHint = createText(
          "back-hint",
          "Press Escape to go back to main menu",
          { left: centerX(renderer, 35), top: 16 },
          { fg: colors.secondary }
        )
        addElement(backHint)
        return
      }

      const projectOptions: SelectOption[] = response.data.personal.map(project => ({
        name: project.name,
        description: `Pull ${project.envCount || 0} environment variables from ${project.name}`,
        value: project.id,
      }))

      const projectSelect = createSelect(
        "pull-projects",
        projectOptions,
        { left: centerX(renderer, 76), top: 12 },
        { width: 76, height: 10 }
      )

      projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          await showPullConfirm(option.value as string)
        })
      })

      addElement(projectSelect)

      const controlsTextElement = createText(
        "controls-text",
        controlsHelpText,
        { left: centerX(renderer, 40), top: 24 },
        { fg: colors.muted }
      )
      addElement(controlsTextElement)

      // Auto-focus
      setTimeout(() => {
        if (projectSelect) {
          projectSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error fetching projects for pull: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading projects. Please try again.",
        { left: centerX(renderer, 35), top: 14 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  async function showPullConfirm(projectId: string) {
    debugLog(`📥 Showing pull confirmation for project: ${projectId}`)
    clearScreen()
    setCurrentScreen("pull-confirm")

    if (!parentContainer) return

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading project details...",
      { left: centerX(renderer, 25), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      // Get project details for confirmation
      const response = await apiClient.getProject(projectId)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data) {
        debugLog("❌ Failed to fetch project for pull confirmation")
        const errorText = createText(
          "error-text",
          "Failed to load project details. Please try again.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const project = response.data
      const envCount = project.envs?.length || 0

      const titleBox = createBox(
        "pull-confirm-title",
        "Confirm Pull Operation",
        { left: centerX(renderer, 80), top: 8 },
        { width: 80, height: 8 }
      )
      addElement(titleBox)

      const confirmText = createText(
        "pull-confirm-text",
        `Are you sure you want to pull ${envCount} environment variables from "${project.name}"?\n\nThis will create/overwrite your local .env file.`,
        { left: centerX(renderer, 70), top: 12 },
        { fg: colors.secondary }
      )
      addElement(confirmText)

      const confirmOptions: SelectOption[] = [
        { name: "Yes, Pull Variables", description: `Download ${envCount} variables and write to .env file`, value: "confirm" },
        { name: "Cancel", description: "Go back without pulling", value: "cancel" },
      ]

      const confirmSelect = createSelect(
        "pull-confirm-select",
        confirmOptions,
        { left: centerX(renderer, 76), top: 18 },
        { width: 76, height: 2 }
      )

      confirmSelect.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          if (option.value === "confirm") {
            await runPull(projectId)
            await showPullEnv() // Go back to pull menu instead of main menu
          } else {
            await showPullEnv()
          }
        })
      })

      addElement(confirmSelect)

      // Auto-focus
      setTimeout(() => {
        if (confirmSelect) {
          confirmSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error loading project for pull confirmation: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading project details. Please try again.",
        { left: centerX(renderer, 45), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  async function showPushEnv() {
    debugLog("📤 Showing push environment variables screen...")
    clearScreen()
    setCurrentScreen("push-env")

    if (!parentContainer) return

    const titleBox = createBox(
      "push-title",
      "Push Environment Variables",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const instructionText = createText(
      "push-instruction",
      "Select a project to push environment variables to:",
      { left: centerX(renderer, 50), top: 10 },
      { fg: colors.secondary }
    )
    addElement(instructionText)

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading projects...",
      { left: centerX(renderer, 20), top: 14 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      debugLog("🌐 Fetching projects for push...")
      const response = await apiClient.listProjects()
      debugLog(`📦 Push projects response: ${JSON.stringify({ success: response.success, count: response.data?.personal.length || 0 })}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data || response.data.personal.length === 0) {
        debugLog("❌ No projects available for push")
        const noProjectsText = createText(
          "no-projects-text",
          "No projects available to push to.",
          { left: centerX(renderer, 35), top: 14 },
          { fg: colors.muted }
        )
        addElement(noProjectsText)

        const backHint = createText(
          "back-hint",
          "Press Escape to go back to main menu",
          { left: centerX(renderer, 35), top: 16 },
          { fg: colors.secondary }
        )
        addElement(backHint)
        return
      }

      const projectOptions: SelectOption[] = response.data.personal.map(project => ({
        name: project.name,
        description: `Push variables to ${project.name}`,
        value: project.id,
      }))

      const projectSelect = createSelect(
        "push-projects",
        projectOptions,
        { left: centerX(renderer, 76), top: 12 },
        { width: 76, height: 10 }
      )

      projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          await showPushVarSelection(option.value as string)
        })
      })

      addElement(projectSelect)

      const controlsTextElement = createText(
        "controls-text",
        controlsHelpText,
        { left: centerX(renderer, 40), top: 24 },
        { fg: colors.muted }
      )
      addElement(controlsTextElement)

      // Auto-focus
      setTimeout(() => {
        if (projectSelect) {
          projectSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error fetching projects for push: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading projects. Please try again.",
        { left: centerX(renderer, 35), top: 14 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  async function showPushVarSelection(projectId: string) {
    debugLog(`📤 Showing push variable selection for project: ${projectId}`)
    clearScreen()
    setCurrentScreen("push-var-selection")

    if (!parentContainer) return

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading project details...",
      { left: centerX(renderer, 25), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      // Get project details with environment variables
      const response = await apiClient.getProject(projectId)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data) {
        debugLog("❌ Failed to fetch project for push var selection")
        const errorText = createText(
          "error-text",
          "Failed to load project details. Please try again.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const project = response.data
      debugLog(`✅ Project loaded for push: ${project.name}, ${project.envs?.length || 0} env vars`)

      const titleBox = createBox(
        "push-vars-title",
        `Push Variables to ${project.name}`,
        { left: centerX(renderer, 80), top: 6 },
        { width: 80, height: 3 }
      )
      addElement(titleBox)

      if (!project.envs || project.envs.length === 0) {
        const noEnvText = createText(
          "no-env-text",
          "No environment variables found for this project to push.",
          { left: centerX(renderer, 50), top: 12 },
          { fg: colors.muted }
        )
        addElement(noEnvText)

        const backHint = createText(
          "back-hint",
          "Press Escape to go back to project selection",
          { left: centerX(renderer, 40), top: 14 },
          { fg: colors.secondary }
        )
        addElement(backHint)
        return
      }

      const varOptions: SelectOption[] = project.envs.map(envVar => ({
        name: envVar.key,
        description: `${envVar.environmentName || "default"}: ${envVar.value.substring(0, 30)}...`,
        value: envVar.id,
      }))

      const varsSelect = createSelect(
        "push-vars-list",
        varOptions,
        { left: centerX(renderer, 76), top: 10 },
        { width: 76, height: 12 }
      )

      varsSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          const selectedEnvVar = project.envs?.find(env => env.id === option.value)
          if (selectedEnvVar) {
            await showPushConfirm(projectId, selectedEnvVar.key)
          }
        })
      })

      addElement(varsSelect)

      const controlsTextElement = createText(
        "controls-text",
        controlsHelpText,
        { left: centerX(renderer, 40), top: 24 },
        { fg: colors.muted }
      )
      addElement(controlsTextElement)

      // Auto-focus
      setTimeout(() => {
        if (varsSelect) {
          varsSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error loading project for push var selection: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading project details. Please try again.",
        { left: centerX(renderer, 45), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  async function showPushConfirm(projectId: string, varKey: string) {
    debugLog(`📤 Showing push confirmation for project: ${projectId}, var: ${varKey}`)
    clearScreen()
    setCurrentScreen("push-confirm")

    if (!parentContainer) return

    // Show loading message
    const loadingText = createText(
      "loading-text",
      "Loading project details...",
      { left: centerX(renderer, 25), top: 12 },
      { fg: colors.muted }
    )
    addElement(loadingText)

    try {
      // Get project details to find the environment variable
      const response = await apiClient.getProject(projectId)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      if (!response.success || !response.data) {
        debugLog("❌ Failed to fetch project for push confirmation")
        const errorText = createText(
          "error-text",
          "Failed to load project details. Please try again.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const project = response.data
      const envVar = project.envs?.find(env => env.key === varKey)
      
      if (!envVar) {
        debugLog("❌ Environment variable not found")
        const errorText = createText(
          "error-text",
          "Environment variable not found. Please try again.",
          { left: centerX(renderer, 45), top: 12 },
          { fg: colors.error }
        )
        addElement(errorText)
        return
      }

      const titleBox = createBox(
        "push-confirm-title",
        "Confirm Push Operation",
        { left: centerX(renderer, 80), top: 8 },
        { width: 80, height: 8 }
      )
      addElement(titleBox)

      const confirmText = createText(
        "push-confirm-text",
        `Push "${envVar.key}" to "${project.name}"?\n\nValue: ${envVar.value}\nEnvironment: ${envVar.environmentName || "default"}`,
        { left: centerX(renderer, 70), top: 12 },
        { fg: colors.secondary }
      )
      addElement(confirmText)

      const confirmOptions: SelectOption[] = [
        { name: "Yes, Push Variable", description: "Upload this environment variable", value: "confirm" },
        { name: "Cancel", description: "Go back without pushing", value: "cancel" },
      ]

      const confirmSelect = createSelect(
        "push-confirm-select",
        confirmOptions,
        { left: centerX(renderer, 76), top: 19 },
        { width: 76, height: 2 }
      )

      confirmSelect.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number, option: SelectOption) => {
        handleDebouncedSelection(async () => {
          if (option.value === "confirm") {
            await runPush(projectId)
            showMainMenu()
          } else {
            await showPushVarSelection(projectId)
          }
        })
      })

      addElement(confirmSelect)

      // Auto-focus
      setTimeout(() => {
        if (confirmSelect) {
          confirmSelect.focus()
        }
      }, 100)

    } catch (error) {
      debugLog(`❌ Error loading project for push confirmation: ${error}`)
      
      // Remove loading text
      if (parentContainer) {
        parentContainer.remove("loading-text")
      }

      const errorText = createText(
        "error-text",
        "Error loading project details. Please try again.",
        { left: centerX(renderer, 45), top: 12 },
        { fg: colors.error }
      )
      addElement(errorText)
    }
  }

  return {
    showProjects,
    showCreateProject,
    showProjectDetails,
    showProjectEnvVars,
    showPullEnv,
    showPullConfirm,
    showPushEnv,
    showPushVarSelection,
    showPushConfirm,
    showEnvVarDetails,
  }
}
