import { CliRenderer, InputRenderable, InputRenderableEvents, SelectRenderableEvents, type SelectOption } from "@opentui/core"
import { createBox, createText, createSelect, centerX, colors } from "../ui/ui"
import { saveToken, isAuthenticated, openBrowser } from "../utils/auth"
import { apiClient } from "../lib/trpc-client"
import fs from 'fs'

// Debug logger that writes to file
const debugLog = (message: string) => {
  fs.appendFileSync('/tmp/cli-debug.log', `${new Date().toISOString()} ${message}\n`)
}

export interface AuthScreens {
  showLoginScreen: () => void
  showDeviceAuth: () => void
  showAuthError: () => void
  showAuthenticating: () => void
}

export function createAuthScreens(
  renderer: CliRenderer,
  parentContainer: any,
  addElement: (element: any) => void,
  clearScreen: () => void,
  setCurrentScreen: (screen: string) => void,
  showSplashScreen: () => void,
  onTokenSet: (token: string) => void
): AuthScreens {
  let pollInterval: NodeJS.Timeout | null = null

  function showLoginScreen() {
    debugLog("🔑 Showing login screen...")
    clearScreen()
    setCurrentScreen("login")

    if (!parentContainer) {
      debugLog("❌ No parent container for login screen!")
      return
    }

    const titleBox = createBox(
      "login-title",
      "Authentication Required",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const step1 = createText(
      "login-step1",
      "Press SPACE to start device authentication",
      { left: centerX(renderer, 40), top: 10 },
      { fg: colors.primary }
    )
    addElement(step1)

    const step2 = createText(
      "login-step2",
      "or 'q' to quit",
      { left: centerX(renderer, 15), top: 12 },
      { fg: colors.muted }
    )
    addElement(step2)
  }

  async function showDeviceAuth() {
    debugLog("📱 Starting device authorization flow...")
    clearScreen()
    setCurrentScreen("device-auth")

    if (!parentContainer) {
      debugLog("❌ No parent container for device auth!")
      return
    }

    // Request device code from API
    const deviceResponse = await apiClient.requestDeviceCode()
    
    if (!deviceResponse.success || !deviceResponse.data) {
      debugLog("❌ Failed to get device code")
      showAuthError()
      return
    }

    const { deviceCode, userCode, verificationUri, expiresIn, interval } = deviceResponse.data

    const titleBox = createBox(
      "device-title",
      "Device Authorization",
      { left: centerX(renderer, 80), top: 6 },
      { width: 80, height: 3 }
    )
    addElement(titleBox)

    const step1 = createText(
      "device-step1",
      `1. Go to: ${verificationUri}`,
      { left: centerX(renderer, 60), top: 10 },
      { fg: colors.primary }
    )
    addElement(step1)

    const step2 = createText(
      "device-step2",
      `2. Enter this code: ${userCode}`,
      { left: centerX(renderer, 40), top: 12 },
      { fg: colors.primary }
    )
    addElement(step2)

    const codeBox = createBox(
      "user-code",
      userCode,
      { left: centerX(renderer, 20), top: 14 },
      { width: 20, height: 3 },
      {
        borderStyle: "double",
        bg: colors.instructionsBg,
        borderColor: colors.primary,
      }
    )
    addElement(codeBox)

    const waitingText = createText(
      "waiting-text",
      "Waiting for authorization... (Press ESC to cancel)",
      { left: centerX(renderer, 50), top: 18 },
      { fg: colors.muted }
    )
    addElement(waitingText)

    // Open browser to verification URI
    const command = process.platform === "darwin" ? "open" : 
                    process.platform === "win32" ? "start" : "xdg-open";
    
    try {
      require("child_process").exec(`${command} ${verificationUri}`);
    } catch (error) {
      debugLog(`❌ Failed to open browser: ${error}`);
    }

    // Start polling for token
    let attempts = 0
    const maxAttempts = Math.floor(expiresIn / interval)

    debugLog(`🔄 Starting to poll for token. Max attempts: ${maxAttempts}`)

    pollInterval = setInterval(async () => {
      attempts++
      debugLog(`📊 Polling attempt ${attempts}/${maxAttempts}`)

      if (attempts > maxAttempts) {
        debugLog("⏰ Device code expired")
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        showAuthError()
        return
      }

      const tokenResponse = await apiClient.pollForToken(deviceCode)
      
      if (tokenResponse.success && tokenResponse.data?.token) {
        debugLog("✅ Device authorization successful!")
        
        // Clear polling interval
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }

        // Save token and proceed
        const token = tokenResponse.data.token
        saveToken(token)
        onTokenSet(token)
        
        if (await isAuthenticated()) {
          debugLog("🎯 Authentication verified, showing splash screen...")
          showSplashScreen()
        } else {
          debugLog("❌ Token verification failed")
          showAuthError()
        }
      } else if (tokenResponse.error && !tokenResponse.error.includes("Authorization pending")) {
        debugLog(`❌ Device auth error: ${tokenResponse.error}`)
        
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        
        showAuthError()
      }
      // If "Authorization pending", continue polling
    }, interval * 1000)
  }

  function showAuthenticating() {
    debugLog("⏳ Showing authenticating screen...")
    clearScreen()
    setCurrentScreen("authenticating")

    if (!parentContainer) {
      debugLog("❌ No parent container for authenticating screen!")
      return
    }

    const statusBox = createBox(
      "auth-status",
      "Authenticating...",
      { left: centerX(renderer, 80), top: 10 },
      { width: 80, height: 6 },
      {
        borderStyle: "single",
      }
    )
    addElement(statusBox)

    const statusText = createText(
      "auth-status-text",
      "Opening browser for authentication...",
      { left: centerX(renderer, 76), top: 12 },
      { fg: colors.primary }
    )
    addElement(statusText)
  }

  function showAuthError() {
    clearScreen()
    setCurrentScreen("auth-error")

    if (!parentContainer) return

    const errorBox = createBox(
      "error-title",
      "Authentication Failed",
      { left: centerX(renderer, 80), top: 10 },
      { width: 80, height: 6 },
      {
        borderStyle: "single",
      }
    )
    addElement(errorBox)

    const errorText = createText(
      "error-text",
      "Failed to authenticate. Press any key to try again.",
      { left: centerX(renderer, 50), top: 12 },
      { fg: colors.primary }
    )
    addElement(errorText)
  }

  // Cleanup function for device auth polling
  function cleanup() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    showLoginScreen,
    showDeviceAuth,
    showAuthError,
    showAuthenticating,
    cleanup,
  } as AuthScreens & { cleanup: () => void }
}
