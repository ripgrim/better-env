#!/usr/bin/env bun

import {
  CliRenderer,
  createCliRenderer,
  TextRenderable,
  RGBA,
  GroupRenderable,
  FrameBufferRenderable,
  BoxRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  type SelectOption,
  TextAttributes,
  type ParsedKey,
} from "@opentui/core"
import { getKeyHandler } from "@opentui/core"

let renderer: CliRenderer | null = null
let parentContainer: GroupRenderable | null = null
let currentScreen: string = "splash"
let currentScreenElements: (TextRenderable | SelectRenderable | BoxRenderable | FrameBufferRenderable)[] = []
let focusedSelectElement: SelectRenderable | null = null

const mockProjects = [
  {
    id: "1",
    name: "my-api",
    status: "active",
    envVars: [
      { key: "DATABASE_URL", value: "postgresql://user:pass@localhost:5432/db", environment: "production" },
      { key: "API_KEY", value: "sk_live_1234567890abcdef", environment: "production" },
      { key: "DEBUG", value: "false", environment: "production" },
      { key: "JWT_SECRET", value: "super-secret-jwt-key-2024", environment: "production" },
    ],
  },
  {
    id: "2",
    name: "frontend-app",
    status: "active",
    envVars: [
      { key: "REACT_APP_API_URL", value: "https://api.example.com", environment: "production" },
      { key: "REACT_APP_DEBUG", value: "false", environment: "production" },
      { key: "NODE_ENV", value: "production", environment: "production" },
    ],
  },
  {
    id: "3",
    name: "database-service",
    status: "paused",
    envVars: [
      { key: "DB_HOST", value: "localhost", environment: "staging" },
      { key: "DB_PORT", value: "5432", environment: "staging" },
      { key: "DB_NAME", value: "myapp_db", environment: "staging" },
      { key: "DB_USER", value: "dbuser", environment: "staging" },
      { key: "DB_PASSWORD", value: "secretpass123", environment: "staging" },
    ],
  },
  {
    id: "4",
    name: "auth-service",
    status: "active",
    envVars: [
      { key: "JWT_SECRET", value: "auth-secret-key", environment: "production" },
      { key: "SESSION_TIMEOUT", value: "3600", environment: "production" },
    ],
  },
  {
    id: "5",
    name: "analytics-api",
    status: "active",
    envVars: [
      { key: "ANALYTICS_API_KEY", value: "analytics_12345", environment: "production" },
      { key: "DATA_RETENTION_DAYS", value: "90", environment: "production" },
      { key: "REDIS_URL", value: "redis://localhost:6379", environment: "production" },
      { key: "LOG_LEVEL", value: "info", environment: "production" },
    ],
  },
]

const mainMenuOptions: SelectOption[] = [
  { name: "View Projects", description: "See all your projects and their environment variables", value: "projects" },
  { name: "Create New Project", description: "Start a new project with environment setup", value: "create" },
  { name: "Pull Environment Variables", description: "Download env vars from a project", value: "pull" },
  { name: "Push Environment Variables", description: "Upload env vars to a project", value: "push" },
  { name: "Settings", description: "Configure CLI preferences", value: "settings" },
  { name: "Quit", description: "Exit the Better Env CLI", value: "quit" },
]

function clearScreen() {
  if (focusedSelectElement) {
    focusedSelectElement.blur()
    focusedSelectElement = null
  }

  if (parentContainer && currentScreenElements.length > 0) {
    currentScreenElements.forEach((element) => {
      if (element instanceof SelectRenderable) {
        element.destroy()
      }
      parentContainer!.remove(element.id)
    })
    currentScreenElements = []
  }
}

function addElement(element: TextRenderable | SelectRenderable | BoxRenderable | FrameBufferRenderable) {
  if (parentContainer) {
    parentContainer.add(element)
    currentScreenElements.push(element)

    if (element instanceof SelectRenderable) {
      focusedSelectElement = element
      element.focus()
    }
  }
}

function showSplashScreen() {
  clearScreen()
  currentScreen = "splash"

  if (!parentContainer) return

  const asciiArt = new FrameBufferRenderable("splash-ascii", {
    width: 60,
    height: 6,
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 60) / 2), top: 3 },
    zIndex: 20,
    respectAlpha: true,
  })

  const betterText = [            
    " __           __   __                                        ",
    "|  |--.-----.|  |_|  |_.-----.----.______.-----.-----.--.--. ",
    "|  _  |  -__||   _|   _|  -__|   _|______|  -__|     |  |  |",
    "|_____|_____||____|____|_____|__|        |_____|__|__|\\___/ ",
    "                                                             ",
]



  for (let i = 0; i < betterText.length; i++) {
    asciiArt.frameBuffer.drawText(betterText[i], 0, i, RGBA.fromInts(160, 160, 160, 255), RGBA.fromInts(0, 0, 0, 0))
  }



  addElement(asciiArt)

  const subtitleText = new TextRenderable("splash-subtitle", {
    content: "Environment Variable Management",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 31) / 2), top: 11 },
    fg: RGBA.fromInts(176, 176, 176, 255),
    bg: RGBA.fromInts(0, 0, 0, 0),
    zIndex: 20,
  })
  addElement(subtitleText)

  const instructionsText = new TextRenderable("splash-instructions", {
    content: "Press any key to continue to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 38) / 2), top: 14 },
    fg: RGBA.fromInts(112, 112, 112, 255),
    bg: RGBA.fromInts(0, 0, 0, 0),
    zIndex: 20,
  })
  addElement(instructionsText)

  const versionText = new TextRenderable("splash-version", {
    content: "v1.0.0",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 6) / 2), top: 16 },
    fg: RGBA.fromInts(80, 80, 80, 255),
    bg: RGBA.fromInts(0, 0, 0, 0),
    zIndex: 20,
  })
  addElement(versionText)
}

function showMainMenu() {
  clearScreen()
  currentScreen = "main"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("title-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#1a1a1a",
    borderStyle: "rounded",
    borderColor: "#333333",
    title: "BETTER ENV CLI",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const menuBox = new BoxRenderable("menu-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 12,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Main Menu",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(menuBox)

  const menuSelect = new SelectRenderable("main-menu", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 8,
    options: mainMenuOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  menuSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    handleMenuSelection(option.value as string)
  })

  addElement(menuSelect)

  const controlsText = new TextRenderable("controls-text", {
    content: "↑↓: Navigate | Enter: Select | Esc: Back",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 32) / 2), top: 20 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(controlsText)
}

function showProjects() {
  clearScreen()
  currentScreen = "projects"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("projects-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: "Your Projects",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const projectOptions: SelectOption[] = mockProjects.map((project) => ({
    name: `${project.name}`,
    description: `${project.envVars.length} environment variables | Status: ${project.status}`,
    value: project.id,
  }))

  const projectsBox = new BoxRenderable("projects-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 16,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Project List",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(projectsBox)

  const projectSelect = new SelectRenderable("projects-list", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 12,
    options: projectOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    showProjectDetails(option.value as string)
  })

  addElement(projectSelect)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 45) / 2), top: 24 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showProjectDetails(projectId: string) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return

  clearScreen()
  currentScreen = "project-details"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("project-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: `Project: ${project.name}`,
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const detailsBox = new BoxRenderable("project-details", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 12,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Project Information",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(detailsBox)

  const detailsText = [
    `Project ID: ${project.id}`,
    `Name: ${project.name}`,
    `Environment Variables: ${project.envVars.length}`,
    `Status: ${project.status}`,
    `Created: 2024-01-15`,
    `Last Updated: 2024-08-14`,
  ]

  detailsText.forEach((text, index) => {
    const detailText = new TextRenderable(`detail-${index}`, {
      content: text,
      positionType: "absolute",
      position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 + index },
      fg: "#b0b0b0",
      bg: "transparent",
      zIndex: 15,
    })
    addElement(detailText)
  })

  const actionsBox = new BoxRenderable("actions-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 16 },
    width: 80,
    height: 6,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Actions",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(actionsBox)

  const actionOptions: SelectOption[] = [
    {
      name: "View Environment Variables",
      description: `Browse ${project.envVars.length} environment variables`,
      value: "envvars",
    },
    { name: "Back to Projects", description: "Return to projects list", value: "back" },
  ]

  const actionSelect = new SelectRenderable("project-actions", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 18 },
    width: 76,
    height: 2,
    options: actionOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  actionSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    if (option.value === "envvars") {
      showProjectEnvVars(project.id)
    } else if (option.value === "back") {
      showProjects()
    }
  })

  addElement(actionSelect)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to projects",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 48) / 2), top: 20 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showProjectEnvVars(projectId: string) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return

  clearScreen()
  currentScreen = "project-envvars"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("env-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: `Environment Variables - ${project.name}`,
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const envOptions: SelectOption[] = project.envVars.map((env) => ({
    name: `${env.key}`,
    description: `${env.value.substring(0, 40)}... (${env.environment})`,
    value: env.key,
  }))

  const envBox = new BoxRenderable("env-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 16,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Environment Variables List",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(envBox)

  const envSelect = new SelectRenderable("env-list", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 12,
    options: envOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  envSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    showEnvVarDetails(projectId, option.value as string)
  })

  addElement(envSelect)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to project details",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 50) / 2), top: 24 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}



function showEnvVarDetails(projectId: string, envKey: string) {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return

  const envVar = project.envVars.find((e) => e.key === envKey)
  if (!envVar) return

  clearScreen()
  currentScreen = "env-details"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("env-detail-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: `Environment Variable: ${envKey}`,
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const detailsBox = new BoxRenderable("env-details", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 12,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Variable Details",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(detailsBox)

  const detailsText = [
    `Key: ${envVar.key}`,
    `Value: ${envVar.value}`,
    `Environment: ${envVar.environment}`,
    `Type: String`,
    `Sensitive: ${envVar.key.includes("KEY") || envVar.key.includes("SECRET") ? "Yes" : "No"}`,
    `Last Modified: 2024-08-14`,
  ]

  detailsText.forEach((text, index) => {
    const detailText = new TextRenderable(`env-detail-${index}`, {
      content: text,
      positionType: "absolute",
      position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 + index },
      fg: "#b0b0b0",
      bg: "transparent",
      zIndex: 15,
    })
    addElement(detailText)
  })

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to project environment variables",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 60) / 2), top: 20 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showCreateProject() {
  clearScreen()
  currentScreen = "create"

  if (!parentContainer) return

  const statusBox = new BoxRenderable("create-status", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 8,
    bg: "#059669",
    borderStyle: "single",
    borderColor: "#10b981",
    title: "Project Created Successfully!",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(statusBox)

  const statusText = new TextRenderable("status-text", {
    content: "Project 'new-service' created successfully!",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    fg: "#ffffff",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(statusText)

  const detailsText = new TextRenderable("details-text", {
    content: "• Environment variables initialized",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 9 },
    fg: "#a0a0a0",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(detailsText)

  const backText = new TextRenderable("back-text", {
    content: "Press Esc or Backspace to return to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 11 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(backText)
}

function showPullEnv() {
  clearScreen()
  currentScreen = "pull"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("pull-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: "Pull Environment Variables",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const projectOptions: SelectOption[] = mockProjects.map(project => ({
    name: `${project.name}`,
    description: `Pull ${project.envVars.length} environment variables | Status: ${project.status}`,
    value: project.id,
  }))

  const projectBox = new BoxRenderable("pull-projects-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 16,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Select Project to Pull From",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(projectBox)

  const projectSelect = new SelectRenderable("pull-projects", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 12,
    options: projectOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    showPullConfirm(option.value as string)
  })

  addElement(projectSelect)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 45) / 2), top: 24 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showPullConfirm(projectId: string) {
  const project = mockProjects.find(p => p.id === projectId)
  if (!project) return

  clearScreen()
  currentScreen = "pull-confirm"

  if (!parentContainer) return

  const statusBox = new BoxRenderable("pull-status", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 8,
    bg: "#2a2a2a",
    borderStyle: "single",
    borderColor: "#404040",
    title: "Environment Variables Pulled",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(statusBox)

  const statusText = new TextRenderable("pull-status-text", {
    content: `Successfully pulled ${project.envVars.length} environment variables`,
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    fg: "#ffffff",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(statusText)

  const detailsText = new TextRenderable("pull-details", {
    content: `from project '${project.name}' (${project.envVars[0]?.environment || 'production'})`,
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 9 },
    fg: "#a0a0a0",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(detailsText)

  const backText = new TextRenderable("pull-back", {
    content: "Press Esc or Backspace to return to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 11 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(backText)
}

function showPushEnv() {
  clearScreen()
  currentScreen = "push"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("push-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: "Push Environment Variables",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const projectOptions: SelectOption[] = mockProjects.map(project => ({
    name: `${project.name}`,
    description: `Push to ${project.envVars.length} environment variables | Status: ${project.status}`,
    value: project.id,
  }))

  const projectBox = new BoxRenderable("push-projects-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 16,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Select Project to Push To",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(projectBox)

  const projectSelect = new SelectRenderable("push-projects", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 12,
    options: projectOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  projectSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    showPushVarSelection(option.value as string)
  })

  addElement(projectSelect)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 45) / 2), top: 24 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showPushVarSelection(projectId: string) {
  const project = mockProjects.find(p => p.id === projectId)
  if (!project) return

  clearScreen()
  currentScreen = "push-vars"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("push-vars-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: `Push Variables to ${project.name}`,
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const varOptions: SelectOption[] = project.envVars.map(env => ({
    name: `${env.key}`,
    description: `${env.value.substring(0, 40)}... (${env.environment})`,
    value: env.key,
  }))

  const varsBox = new BoxRenderable("push-vars-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 16,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "Select Variables to Push",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(varsBox)

  const varsSelect = new SelectRenderable("push-vars-list", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    width: 76,
    height: 12,
    options: varOptions,
    backgroundColor: "#151515",
    focusedBackgroundColor: "#252525",
    textColor: "#b0b0b0",
    focusedTextColor: "#e0e0e0",
    selectedBackgroundColor: "#404040",
    selectedTextColor: "#ffffff",
    descriptionColor: "#707070",
    selectedDescriptionColor: "#a0a0a0",
    showScrollIndicator: true,
    wrapSelection: true,
    showDescription: true,
    zIndex: 15,
  })

  varsSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
    showPushConfirm(projectId, option.value as string)
  })

  addElement(varsSelect)

  const instructionsText = new TextRenderable("push-instructions", {
    content: "Select environment variable to push to the project",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 45) / 2), top: 22 },
    fg: "#a0a0a0",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(instructionsText)

  const backText = new TextRenderable("back-text", {
    content: "Press 'Esc' or 'Backspace' to go back",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 33) / 2), top: 24 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function showPushConfirm(projectId: string, varKey: string) {
  const project = mockProjects.find(p => p.id === projectId)
  if (!project) return

  clearScreen()
  currentScreen = "push-confirm"

  if (!parentContainer) return

  const statusBox = new BoxRenderable("push-status", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 8,
    bg: "#2a2a2a",
    borderStyle: "single",
    borderColor: "#404040",
    title: "Environment Variable Pushed",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(statusBox)

  const statusText = new TextRenderable("push-status-text", {
    content: `Successfully pushed ${varKey}`,
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 },
    fg: "#ffffff",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(statusText)

  const detailsText = new TextRenderable("push-details", {
    content: `to project '${project.name}' (${project.envVars[0]?.environment || 'production'})`,
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 9 },
    fg: "#a0a0a0",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(detailsText)

  const backText = new TextRenderable("push-back", {
    content: "Press Esc or Backspace to return to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 11 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 15,
  })
  addElement(backText)
}

function showSettings() {
  clearScreen()
  currentScreen = "settings"

  if (!parentContainer) return

  const titleBox = new BoxRenderable("settings-title", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 1 },
    width: 80,
    height: 3,
    bg: "#2a2a2a",
    borderStyle: "rounded",
    borderColor: "#404040",
    title: "Settings",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(titleBox)

  const settingsBox = new BoxRenderable("settings-box", {
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 80) / 2), top: 6 },
    width: 80,
    height: 12,
    bg: "#151515",
    borderStyle: "single",
    borderColor: "#2a2a2a",
    title: "CLI Configuration",
    titleAlignment: "center",
    zIndex: 10,
  })
  addElement(settingsBox)

  const settingsText = [
    "Theme: Dark",
    "Auto-save: Enabled",
    "Default Environment: production",
    "Log Level: info",
    "Update Check: Daily",
    "Backup: Enabled",
  ]

  settingsText.forEach((text, index) => {
    const settingText = new TextRenderable(`setting-${index}`, {
      content: text,
      positionType: "absolute",
      position: { left: Math.floor((renderer!.terminalWidth - 76) / 2), top: 8 + index },
      fg: "#b0b0b0",
      bg: "transparent",
      zIndex: 15,
    })
    addElement(settingText)
  })

  const backText = new TextRenderable("settings-back", {
    content: "Press 'Esc' or 'Backspace' to go back to main menu",
    positionType: "absolute",
    position: { left: Math.floor((renderer!.terminalWidth - 45) / 2), top: 20 },
    fg: "#707070",
    bg: "transparent",
    zIndex: 20,
  })
  addElement(backText)
}

function handleMenuSelection(value: string) {
  switch (value) {
    case "projects":
      showProjects()
      break
    case "create":
      showCreateProject()
      break
    case "pull":
      showPullEnv()
      break
    case "push":
      showPushEnv()
      break
    case "settings":
      showSettings()
      break
    case "quit":
      process.exit(0)
      break
  }
}

function handleKeyPress(key: ParsedKey) {
  if (key.ctrl && key.name === "c") {
    process.exit(0)
  }

  if (key.name === "escape" || key.name === "backspace") {
    switch (currentScreen) {
      case "main":
        showSplashScreen()
        break
      case "projects":
      case "settings":
        showMainMenu()
        break
      case "project-details":
        showProjects()
        break
      case "project-envvars":
        showProjectDetails(currentScreen.split("-")[2] || "1") // fallback to first project
        break
      case "env-details":
        // Navigate back to project env vars - need to track project ID
        showProjectEnvVars("1") // fallback
        break
      case "create":
      case "pull":
      case "push":
      case "pull-confirm":
      case "push-confirm":
        showMainMenu()
        break
      case "push-vars":
        showPushEnv()
        break
    }
    return
  }

  if (currentScreen === "splash") {
    showMainMenu()
    return
  }
}

function cleanup() {
  if (focusedSelectElement) {
    focusedSelectElement.destroy()
  }

  currentScreenElements.forEach((element) => {
    if (element instanceof SelectRenderable) {
      element.destroy()
    }
  })

  if (renderer) {
    getKeyHandler().off("keypress", handleKeyPress)
    renderer.destroy()
  }
}

export async function run(): Promise<void> {
  renderer = await createCliRenderer({
    targetFps: 30,
    exitOnCtrlC: false,
  })

  renderer.start()
  renderer.setBackgroundColor("#0a0a0a")

  parentContainer = new GroupRenderable("main-container", {
    positionType: "absolute",
    position: { left: 0, top: 0 },
    zIndex: 15,
    visible: true,
  })
  renderer.root.add(parentContainer)

  getKeyHandler().on("keypress", handleKeyPress)

  process.on("SIGINT", () => {
    cleanup()
    process.exit(0)
  })

  showSplashScreen()
}

run()
