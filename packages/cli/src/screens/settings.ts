import { CliRenderer, SelectRenderableEvents, type SelectOption } from "@opentui/core"
import { createBox, createText, createSelect, centerX, colors, controlsText as controlsHelpText } from "../ui/ui"
import { logout } from "../utils/auth"

export interface SettingsScreens {
  showSettings: () => Promise<void>
  showUserProfile: () => Promise<void>
}

export function createSettingsScreens(
  renderer: CliRenderer,
  parentContainer: any,
  addElement: (element: any) => void,
  clearScreen: () => void,
  setCurrentScreen: (screen: string) => void,
  handleDebouncedSelection: (callback: () => void) => void,
  showMainMenu: () => void,
  showLoginScreen: () => void,
  getCurrentUser: () => Promise<any>
): SettingsScreens {

  async function showSettings() {
    clearScreen()
    setCurrentScreen("settings")

    if (!parentContainer) return

    const currentUser = await getCurrentUser()

    const titleBox = createBox(
      "settings-title",
      "CLI Settings",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const settingsText = [
      `User: ${currentUser?.name || "Not logged in"}`,
      "Theme: Dark",
      "Auto-save: Enabled",
      "Default Environment: production",
      "Log Level: info",
      "Update Check: Daily",
      "Backup: Enabled",
    ]

    settingsText.forEach((text, index) => {
      const settingText = createText(
        `setting-${index}`,
        text,
        { left: centerX(renderer, 76), top: 10 + index },
        { fg: colors.secondary }
      )
      addElement(settingText)
    })

    const backText = createText(
      "settings-back",
      "Press 'Esc' or 'Backspace' to go back to main menu",
      { left: centerX(renderer, 45), top: 20 },
      { fg: colors.muted }
    )
    addElement(backText)
  }

  async function showUserProfile() {
    clearScreen()
    setCurrentScreen("profile")

    if (!parentContainer) return

    const currentUser = await getCurrentUser()

    const titleBox = createBox(
      "profile-title",
      "User Profile",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const userDetails = [
      `Name: ${currentUser?.name || "Loading..."}`,
      `Email: ${currentUser?.email || "Loading..."}`,
      `User ID: ${currentUser?.id || "Loading..."}`,
      `Status: ${currentUser ? "Authenticated" : "Error fetching user data"}`,
    ]

    userDetails.forEach((detail, index) => {
      const detailText = createText(
        `user-detail-${index}`,
        detail,
        { left: centerX(renderer, 76), top: 10 + index },
        { fg: colors.secondary }
      )
      addElement(detailText)
    })

    const actionOptions: SelectOption[] = [
      { name: "Logout", description: "Sign out and return to login screen", value: "logout" },
      { name: "Back to Main Menu", description: "Return to the main menu", value: "back" },
    ]

    const actionSelect = createSelect(
      "user-actions",
      actionOptions,
      { left: centerX(renderer, 76), top: 20 },
      { width: 76, height: 2 }
    )

    actionSelect.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number, option: SelectOption) => {
      handleDebouncedSelection(async () => {
        if (option.value === "logout") {
          await logout()
          showLoginScreen()
        } else if (option.value === "back") {
          showMainMenu()
        }
      })
    })

    addElement(actionSelect)

    const controlsTextElement = createText(
      "controls-text",
      controlsHelpText,
      { left: centerX(renderer, 40), top: 24 },
      { fg: colors.muted }
    )
    addElement(controlsTextElement)

    // Auto-focus
    setTimeout(() => {
      if (actionSelect) {
        actionSelect.focus()
      }
    }, 100)
  }

  return {
    showSettings,
    showUserProfile,
  }
}
