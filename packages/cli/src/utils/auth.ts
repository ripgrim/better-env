import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { apiClient } from "../lib/trpc-client";

// Debug logger that writes to file
const debugLog = (message: string) => {
  appendFileSync('/tmp/cli-debug.log', `${new Date().toISOString()} ${message}\n`);
};

/**
 * Load CLI token from disk
 */
export function loadToken(): string | null {
  try {
    const tokenPath = join(homedir(), ".better-env", "token");
    if (existsSync(tokenPath)) {
      return readFileSync(tokenPath, "utf8").trim();
    }
  } catch (error) {
    debugLog(`❌ Error loading token: ${error}`);
  }
  return null;
}

/**
 * Save CLI token to disk
 */
export function saveToken(token: string): void {
  debugLog(`💾 Saving token: length=${token.length}, prefix=${token.substring(0, 8)}...`);
  try {
    const configDir = join(homedir(), ".better-env");
    if (!existsSync(configDir)) {
      debugLog("📁 Creating config directory...");
      mkdirSync(configDir, { recursive: true });
    }
    const tokenPath = join(configDir, "token");
    writeFileSync(tokenPath, token);
    debugLog(`✅ Token saved to ${tokenPath}`);
  } catch (error) {
    debugLog(`❌ Error saving token: ${error}`);
  }
}

/**
 * Clear CLI token from disk
 */
export function clearToken(): void {
  try {
    const tokenPath = join(homedir(), ".better-env", "token");
    if (existsSync(tokenPath)) {
      require("fs").unlinkSync(tokenPath);
      debugLog("🗑️ Token cleared");
    }
  } catch (error) {
    debugLog(`❌ Error clearing token: ${error}`);
  }
}

/**
 * Check if user is authenticated via CLI token
 */
export async function isAuthenticated(): Promise<boolean> {
  debugLog("🔍 Checking authentication...");
  const token = loadToken();
  if (!token) {
    debugLog("❌ No token found");
    return false;
  }

  try {
    const result = await apiClient.authenticate(token);
    debugLog(`📋 Auth result: ${JSON.stringify({ success: result.success })}`);
    
    if (result.success) {
      debugLog("✅ Authentication successful!");
      return true;
    }
    
    // If token is invalid, clear it
    if (result.error?.includes("Invalid") || result.error?.includes("expired")) {
      debugLog("🗑️ Token invalid, clearing...");
      clearToken();
    }
    
    debugLog(`❌ Auth failed: ${result.error}`);
    return false;
  } catch (error) {
    debugLog(`❌ Auth error: ${error}`);
    return false;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<any> {
  const token = loadToken();
  if (!token) return null;

  try {
    const result = await apiClient.getCurrentUser();
    return result.success ? result.data : null;
  } catch (error) {
    debugLog(`❌ Get user error: ${error}`);
    return null;
  }
}

/**
 * Logout by clearing the token
 */
export async function logout(): Promise<void> {
  clearToken();
}

/**
 * Open browser to CLI token creation page
 */
export function openBrowser(): void {
  const apiUrl = process.env.BETTER_ENV_API_URL || "http://localhost:3000";
  const command = process.platform === "darwin" ? "open" : 
                  process.platform === "win32" ? "start" : "xdg-open";
  
  try {
    require("child_process").exec(`${command} ${apiUrl}/cli`);
  } catch (error) {
    console.log(`Please open your browser and go to: ${apiUrl}/cli`);
  }
}

/**
 * Try to get CLI token from clipboard and authenticate
 */
export async function tryClipboardAuth(): Promise<{ success: boolean; token?: string }> {
  try {
    let clipboardToken = "";
    
    // Try to get clipboard content
    if (process.platform === "darwin") {
      const { execSync } = require("child_process");
      clipboardToken = execSync("pbpaste", { encoding: "utf8" }).trim();
    } else if (process.platform === "win32") {
      const { execSync } = require("child_process");
      clipboardToken = execSync("powershell.exe Get-Clipboard", { encoding: "utf8" }).trim();
    } else {
      // Linux - try xclip or xsel
      const { execSync } = require("child_process");
      try {
        clipboardToken = execSync("xclip -o -selection clipboard", { encoding: "utf8" }).trim();
      } catch {
        try {
          clipboardToken = execSync("xsel --clipboard --output", { encoding: "utf8" }).trim();
        } catch {
          return { success: false };
        }
      }
    }
    
    if (clipboardToken && clipboardToken.startsWith("cli_")) {
      // Validate token by authenticating with it
      const result = await apiClient.authenticate(clipboardToken);
      
      if (result.success) {
        saveToken(clipboardToken);
        return { success: true, token: clipboardToken };
      }
    }
    
    return { success: false };
  } catch (error) {
    debugLog(`❌ Clipboard auth error: ${error}`);
    return { success: false };
  }
}