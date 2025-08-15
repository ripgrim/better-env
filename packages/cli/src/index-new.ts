#!/usr/bin/env bun

import {
  CliRenderer,
  createCliRenderer,
  GroupRenderable,
  type ParsedKey,
} from "@opentui/core"
import { getKeyHandler } from "@opentui/core"

// Utils
import { isAuthenticated, getCurrentUser, tryClipboardAuth, openBrowser, loadToken } from "./utils/auth"
import { handleDebouncedSelection, createScreenManager, runPull, runPush } from "./utils/common"
import { colors } from "./ui/ui"

// Screens
import { createAuthScreens } from "./screens/auth"
import { createMainMenuScreen } from "./screens/main-menu"
import { createProjectScreens } from "./screens/projects"
import { createSettingsScreens } from "./screens/settings"

let renderer: CliRenderer | null = null
let parentContainer: GroupRenderable | null = null
let currentUser: { id: string; name: string; email: string; image?: string | null } | null = null
let cliToken: string | null = null

// Screen manager
const screenManager = createScreenManager()
const { setCurrentScreen, getCurrentScreen, clearScreen, addElement, setFocusedElement, cleanup } = screenManager

// Screen instances
let authScreens: any = null
let mainMenuScreen: any = null
let projectScreens: any = null
let settingsScreens: any = null

function handleMenuSelection(value: string) {
  switch (value) {
    case "projects":
      projectScreens.showProjects()
      break
    case "create":
      projectScreens.showCreateProject()
      break
    case "pull":
      projectScreens.showPullEnv()
      break
    case "push":
      projectScreens.showPushEnv()
      break
    case "profile":
      settingsScreens.showUserProfile()
      break
    case "settings":
      settingsScreens.showSettings()
      break
    case "quit":
      process.exit(0)
      break
  }
}

async function checkAuthAndContinue() {
  if (await isAuthenticated()) {
    currentUser = await getCurrentUser()
    mainMenuScreen.showSplashScreen()
  } else {
    authScreens.showAuthError()
  }
}

async function handleClipboardAuth() {
  const result = await tryClipboardAuth()
  if (result.success && result.token) {
    cliToken = result.token
    if (await isAuthenticated()) {
      currentUser = await getCurrentUser()
      mainMenuScreen.showSplashScreen()
    } else {
      authScreens.showAuthError()
    }
  } else {
    authScreens.showTokenInput()
  }
}

function handleKeyPress(key: ParsedKey) {
  if (key.ctrl && key.name === "c") {
    process.exit(0)
  }

  if (key.name === "escape" || key.name === "backspace") {
    switch (getCurrentScreen()) {
      case "main":
        mainMenuScreen.showSplashScreen()
        break
      case "projects":
      case "profile":
      case "settings":
        mainMenuScreen.showMainMenu()
        break
      case "login":
        process.exit(0)
        break
      case "token-input":
        authScreens.cleanupTokenInput()
        authScreens.showLoginScreen()
        break
      case "project-details":
        projectScreens.showProjects()
        break
      case "project-envvars":
        const projectId = getCurrentScreen().split("-")[2] || "1"
        projectScreens.showProjectDetails(projectId)
        break
      case "create-project":
      case "pull-env":
      case "push-env":
      case "env-var-details":
        mainMenuScreen.showMainMenu()
        break
      case "pull-confirm":
        projectScreens.showPullEnv()
        break
      case "push-var-selection":
        projectScreens.showPushEnv()
        break
      case "push-confirm":
        const currentProjectId = getCurrentScreen().split("-")[2] || "1"
        projectScreens.showPushVarSelection(currentProjectId)
        break
    }
    return
  }

  if (getCurrentScreen() === "splash") {
    mainMenuScreen.showMainMenu()
    return
  }

  if (getCurrentScreen() === "login") {
    if (key.name === "q") {
      process.exit(0)
    } else if (key.name === "o") {
      openBrowser()
    } else if (key.name === "t") {
      authScreens.showTokenInput()
    } else if (key.name === "c") {
      handleClipboardAuth()
    } else {
      checkAuthAndContinue()
    }
    return
  }

  if (getCurrentScreen() === "auth-error") {
    authScreens.showLoginScreen()
    return
  }
}

function initializeScreens() {
  if (!renderer || !parentContainer) return

  // Initialize auth screens
  authScreens = createAuthScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    mainMenuScreen.showSplashScreen,
    (token: string) => {
      cliToken = token
    }
  )

  // Initialize main menu screen
  mainMenuScreen = createMainMenuScreen(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    handleMenuSelection
  )

  // Initialize project screens
  projectScreens = createProjectScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    mainMenuScreen.showMainMenu,
    runPull,
    runPush
  )

  // Initialize settings screens
  settingsScreens = createSettingsScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    mainMenuScreen.showMainMenu,
    authScreens.showLoginScreen,
    () => currentUser
  )
}

function cleanupApp() {
  if (authScreens?.cleanupTokenInput) {
    authScreens.cleanupTokenInput()
  }

  cleanup()
  
  if (renderer) {
    renderer.destroy()
  }
}

export async function run(): Promise<void> {
  renderer = await createCliRenderer({
    targetFps: 30,
    exitOnCtrlC: false,
  })

  renderer.start()
  renderer.setBackgroundColor(colors.background)

  parentContainer = new GroupRenderable("main-container", {
    positionType: "absolute",
    position: {
      left: 0,
      top: 0,
    },
    zIndex: 15,
    visible: true,
  })
  renderer.root.add(parentContainer)

  // Initialize all screen components
  initializeScreens()

  // Set up key handling
  getKeyHandler().on("keypress", handleKeyPress)

  process.on("SIGINT", () => {
    cleanupApp()
    process.exit(0)
  })

  // Check authentication and show appropriate screen
  cliToken = loadToken()
  if (cliToken && (await isAuthenticated())) {
    currentUser = await getCurrentUser()
    mainMenuScreen.showSplashScreen()
  } else {
    authScreens.showLoginScreen()
  }
}

run()
