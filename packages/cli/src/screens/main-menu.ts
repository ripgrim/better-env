import { CliRenderer, SelectRenderableEvents, type SelectOption } from "@opentui/core"
import { createBox, createText, createSelect, centerX, colors, controlsText as controlsHelpText, createLogo } from "../ui/ui"

export interface MainMenuScreen {
  showSplashScreen: () => void
  showMainMenu: () => void
}

const mainMenuOptions: SelectOption[] = [
  { name: "View Projects", description: "See all your projects and their environment variables", value: "projects" },
  { name: "Create New Project", description: "Start a new project with environment setup", value: "create" },
  { name: "Pull Environment Variables", description: "Download env vars from a project", value: "pull" },
  { name: "Push Environment Variables", description: "Upload env vars to a project", value: "push" },
  { name: "Profile", description: "View user profile and logout", value: "profile" },
  { name: "Settings", description: "Configure CLI preferences", value: "settings" },
  { name: "Quit", description: "Exit the Better Env CLI", value: "quit" },
]

export function createMainMenuScreen(
  renderer: CliRenderer,
  parentContainer: any,
  addElement: (element: any) => void,
  clearScreen: () => void,
  setCurrentScreen: (screen: string) => void,
  handleDebouncedSelection: (callback: () => void) => void,
  handleMenuSelection: (value: string) => Promise<void>
): MainMenuScreen {

  function showSplashScreen() {
    clearScreen()
    setCurrentScreen("splash")

    if (!parentContainer) return

    // Create logo
    const logo = createLogo(renderer, { left: 0, top: 2 })
    addElement(logo)

    const subtitleText = createText(
      "subtitle",
      "Better Env CLI - Press any key to continue",
      { left: 2, top: 12 },
      {
        fg: "#6666ff",
        bg: "#002840",
      }
    )
    addElement(subtitleText)

    const versionText = createText(
      "version",
      "v1.0.0",
      { left: 2, top: 14 },
      {
        fg: colors.muted,
        bg: "transparent",
      }
    )
    addElement(versionText)
  }

  function showMainMenu() {
    clearScreen()
    setCurrentScreen("main")

    if (!parentContainer) return

    const titleBox = createBox(
      "main-title",
      "Better Env CLI - Main Menu",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const menuSelect = createSelect(
      "main-menu",
      mainMenuOptions,
      { left: centerX(renderer, 76), top: 8 },
      { width: 76, height: 8 }
    )

    menuSelect.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
      handleDebouncedSelection(async () => {
        await handleMenuSelection(option.value as string)
      })
    })

    addElement(menuSelect)

    const controlsTextElement = createText(
      "controls-text",
      controlsHelpText,
      { left: centerX(renderer, 40), top: 18 },
      { fg: colors.muted }
    )
    addElement(controlsTextElement)

    // Auto-focus the menu
    setTimeout(() => {
      if (menuSelect) {
        menuSelect.focus()
      }
    }, 100)
  }

  return {
    showSplashScreen,
    showMainMenu,
  }
}
