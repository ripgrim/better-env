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
    debugLog("🔑 Auto-starting authentication flow...")
    clearScreen()
    setCurrentScreen("getting-code")

    if (!parentContainer) {
      debugLog("❌ No parent container for login screen!")
      return
    }

    const titleBox = createBox(
      "auth-title",
      "🔐 Better Env CLI",
      { left: centerX(renderer, 60), top: 8 },
      { width: 60, height: 3 }
    )
    addElement(titleBox)

    const statusText = createText(
      "auth-status",
      "Getting authorization code...",
      { left: centerX(renderer, 40), top: 12 },
      { fg: colors.primary }
    )
    addElement(statusText)

    const cancelText = createText(
      "cancel-hint",
      "Press 'q' to quit",
      { left: centerX(renderer, 15), top: 16 },
      { fg: colors.muted }
    )
    addElement(cancelText)

    // Auto-start device auth after a brief moment
    setTimeout(() => {
      showDeviceAuth()
    }, 1000)
  }

  async function showDeviceAuth() {
    debugLog("📱 Starting seamless device authorization...")
    clearScreen()
    setCurrentScreen("device-auth")

    if (!parentContainer) {
      debugLog("❌ No parent container for device auth!")
      return
    }

    // Show getting code state first
    const titleBox = createBox(
      "device-title",
      "🔐 Better Env CLI",
      { left: centerX(renderer, 60), top: 8 },
      { width: 60, height: 3 }
    )
    addElement(titleBox)

    const statusText = createText(
      "auth-status",
      "Opening browser for authorization...",
      { left: centerX(renderer, 40), top: 12 },
      { fg: colors.primary }
    )
    addElement(statusText)

    // Request device code from API
    const deviceResponse = await apiClient.requestDeviceCode()
    
    if (!deviceResponse.success || !deviceResponse.data) {
      debugLog("❌ Failed to get device code")
      showAuthError()
      return
    }

    const { deviceCode, userCode, verificationUri, expiresIn, interval } = deviceResponse.data

    // Auto-open browser immediately
    const verificationUriWithCode = `${verificationUri}?code=${userCode}`;
    const command = process.platform === "darwin" ? "open" :
                    process.platform === "win32" ? "start" : "xdg-open";
    
    try {
      require("child_process").exec(`${command} "${verificationUriWithCode}"`);
      debugLog(`🌐 Auto-opened browser: ${verificationUriWithCode}`);
    } catch (error) {
      debugLog(`❌ Failed to auto-open browser: ${error}`);
    }

    // Update display to show waiting state
    clearScreen()
    
    const waitingTitle = createBox(
      "waiting-title",
      "🔐 Better Env CLI",
      { left: centerX(renderer, 60), top: 6 },
      { width: 60, height: 3 }
    )
    addElement(waitingTitle)

    const browserText = createText(
      "browser-opened",
      "✅ Browser opened for authorization",
      { left: centerX(renderer, 40), top: 10 },
      { fg: colors.primary }
    )
    addElement(browserText)

    const codeBox = createBox(
      "user-code",
      `Code: ${userCode}`,
      { left: centerX(renderer, 25), top: 12 },
      { width: 25, height: 3 },
      {
        borderStyle: "single",
        bg: colors.instructionsBg,
        borderColor: colors.primary,
      }
    )
    addElement(codeBox)

    const waitingText = createText(
      "waiting-text",
      "Waiting for browser authorization...",
      { left: centerX(renderer, 40), top: 16 },
      { fg: colors.muted }
    )
    addElement(waitingText)

    const manualText = createText(
      "manual-hint",
      `Manual: ${verificationUri} • Press 'o' to re-open • 'q' to quit`,
      { left: centerX(renderer, 70), top: 18 },
      { fg: colors.muted }
    )
    addElement(manualText)

    // Store the open browser function for re-opening
    const openBrowser = () => {
      try {
        require("child_process").exec(`${command} "${verificationUriWithCode}"`);
        debugLog(`🌐 Re-opened browser: ${verificationUriWithCode}`);
      } catch (error) {
        debugLog(`❌ Failed to re-open browser: ${error}`);
      }
    };

    (global as any).openBrowserWithCode = openBrowser;

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

        // Show success briefly
        clearScreen()
        const successTitle = createBox(
          "success-title",
          "✅ Authorization Successful",
          { left: centerX(renderer, 60), top: 10 },
          { width: 60, height: 3 }
        )
        addElement(successTitle)

        const successText = createText(
          "success-text",
          "Welcome to Better Env CLI!",
          { left: centerX(renderer, 30), top: 13 },
          { fg: colors.primary }
        )
        addElement(successText)

        // Save token and proceed after brief success display
        const token = tokenResponse.data.token
        saveToken(token)
        onTokenSet(token)
        
        setTimeout(async () => {
          if (await isAuthenticated()) {
            debugLog("🎯 Authentication verified, showing splash screen...")
            showSplashScreen()
          } else {
            debugLog("❌ Token verification failed")
            showAuthError()
          }
        }, 1500)

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
      "❌ Authentication Failed",
      { left: centerX(renderer, 60), top: 8 },
      { width: 60, height: 3 },
      {
        borderStyle: "single",
        borderColor: "red",
      }
    )
    addElement(errorBox)

    const errorText = createText(
      "error-text",
      "Something went wrong during authentication.",
      { left: centerX(renderer, 45), top: 12 },
      { fg: colors.muted }
    )
    addElement(errorText)

    const retryText = createText(
      "retry-text",
      "Press any key to try again, or 'q' to quit",
      { left: centerX(renderer, 45), top: 14 },
      { fg: colors.primary }
    )
    addElement(retryText)

    const helpText = createText(
      "help-text",
      "💡 Make sure your browser allows popups and you're logged into Better Env",
      { left: centerX(renderer, 70), top: 16 },
      { fg: colors.muted }
    )
    addElement(helpText)
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
