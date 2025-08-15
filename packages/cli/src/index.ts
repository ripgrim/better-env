import fs from "fs";
import {
  CliRenderer,
  createCliRenderer,
  GroupRenderable,
  TextRenderable,
  type ParsedKey,
} from "@opentui/core";
import { getKeyHandler } from "@opentui/core";

// Debug logger that writes to file 
const debugLog = (message: string) => {
  fs.appendFileSync(
    "/tmp/cli-debug.log",
    `${new Date().toISOString()} ${message}\n`
  );
};

// Utils
import {
  isAuthenticated,
  getCurrentUser,
  openBrowser,
  loadToken,
} from "./utils/auth";
import {
  handleDebouncedSelection,
  createScreenManager,
  runPull,
  runPush,
} from "./utils/common";
import { colors } from "./ui/ui";

// Screens
import { createAuthScreens } from "./screens/auth";
import { createMainMenuScreen } from "./screens/main-menu";
import { createProjectScreens } from "./screens/projects";
import { createSettingsScreens } from "./screens/settings";

let renderer: CliRenderer | null = null;
let parentContainer: GroupRenderable | null = null;
let currentUser: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
} | null = null;
let cliToken: string | null = null;

// Screen manager
const screenManager = createScreenManager();
const {
  setCurrentScreen,
  getCurrentScreen,
  clearScreen,
  addElement,
  setFocusedElement,
  cleanup,
  setParentContainer,
} = screenManager;

// Screen instances
let authScreens: any = null;
let mainMenuScreen: any = null;
let projectScreens: any = null;
let settingsScreens: any = null;

async function handleMenuSelection(value: string) {
  switch (value) {
    case "projects":
      await projectScreens.showProjects();
      break;
    case "create":
      projectScreens.showCreateProject();
      break;
    case "pull":
      await projectScreens.showPullEnv();
      break;
    case "push":
      await projectScreens.showPushEnv();
      break;
    case "profile":
      await settingsScreens.showUserProfile();
      break;
    case "settings":
      await settingsScreens.showSettings();
      break;
    case "quit":
      process.exit(0);
      break;
  }
}

async function checkAuthAndContinue() {
  if (await isAuthenticated()) {
    currentUser = await getCurrentUser();
    mainMenuScreen.showSplashScreen();
  } else {
    authScreens.showAuthError();
  }
}



function handleKeyPress(key: ParsedKey) {
  debugLog(
    `🎹 Key event: ${JSON.stringify({ name: key.name, sequence: key.sequence, ctrl: key.ctrl, meta: key.meta, shift: key.shift })}`
  );

  // Filter out mouse/touchpad events and unwanted keys
  if (!key.name || key.name.includes("mouse") || key.sequence === "\u001b[M") {
    debugLog("🚫 Ignoring mouse/touchpad event");
    return;
  }

  if (key.ctrl && key.name === "c") {
    process.exit(0);
  }

  if (key.name === "escape" || key.name === "backspace") {
    switch (getCurrentScreen()) {
      case "main":
        mainMenuScreen.showSplashScreen();
        break;
      case "projects":
      case "profile":
      case "settings":
        mainMenuScreen.showMainMenu();
        break;
      case "login":
        process.exit(0);
        break;
      case "device-auth":
        authScreens.cleanup();
        authScreens.showLoginScreen();
        break;
      case "project-details":
        projectScreens.showProjects();
        break;
      case "project-envvars":
        const projectId = getCurrentScreen().split("-")[2] || "1";
        projectScreens.showProjectDetails(projectId);
        break;
      case "create-project":
      case "pull-env":
      case "push-env":
      case "env-var-details":
        mainMenuScreen.showMainMenu();
        break;
      case "pull-confirm":
        projectScreens.showPullEnv();
        break;
      case "push-var-selection":
        projectScreens.showPushEnv();
        break;
      case "push-confirm":
        const currentProjectId = getCurrentScreen().split("-")[2] || "1";
        projectScreens.showPushVarSelection(currentProjectId);
        break;
    }
    return;
  }

  if (getCurrentScreen() === "splash") {
    mainMenuScreen.showMainMenu();
    return;
  }

  if (getCurrentScreen() === "login") {
    if (key.name === "q") {
      debugLog("🚪 User chose to quit");
      process.exit(0);
    } else if (
      key.name === "space" ||
      key.name === "return" ||
      key.name === "enter"
    ) {
      debugLog("🔑 User started device auth flow");
      authScreens.showDeviceAuth();
    } else {
      debugLog(`🚫 Ignoring key '${key.name}' on login screen`);
    }
    return;
  }

  if (getCurrentScreen() === "auth-error") {
    authScreens.showLoginScreen();
    return;
  }
}

function initializeScreens() {
  if (!renderer || !parentContainer) return;

  // Initialize main menu screen first
  mainMenuScreen = createMainMenuScreen(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    handleMenuSelection
  );

  // Initialize auth screens (now mainMenuScreen exists)
  authScreens = createAuthScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    () => mainMenuScreen.showSplashScreen(),
    (token: string) => {
      cliToken = token;
      debugLog(`🔄 Token updated globally: ${token ? "YES" : "NO"}`);
    }
  );

  // Initialize project screens
  projectScreens = createProjectScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    () => mainMenuScreen.showMainMenu(),
    runPull,
    runPush
  );

  // Initialize settings screens
  settingsScreens = createSettingsScreens(
    renderer,
    parentContainer,
    addElement,
    clearScreen,
    setCurrentScreen,
    handleDebouncedSelection,
    () => mainMenuScreen.showMainMenu(),
    () => authScreens.showLoginScreen(),
    getCurrentUser // Pass the actual function that fetches fresh data from API
  );
}

function cleanupApp() {
  if (authScreens?.cleanup) {
    authScreens.cleanup();
  }

  cleanup();

  if (renderer) {
    renderer.destroy();
  }
}

export async function run(): Promise<void> {
  // Clear previous log
  fs.writeFileSync("/tmp/cli-debug.log", "");
  debugLog("🚀 Starting CLI...");

  renderer = await createCliRenderer({
    targetFps: 30,
    exitOnCtrlC: false,
  });

  debugLog("✅ Renderer created");
  // Remove delay for now
  // await new Promise(resolve => setTimeout(resolve, 2000))

  renderer.start();
  renderer.setBackgroundColor(colors.background);

  parentContainer = new GroupRenderable("main-container", {
    positionType: "absolute",
    position: {
      left: 0,
      top: 0,
    },
    zIndex: 15,
    visible: true,
  });
  renderer.root.add(parentContainer);
  debugLog("✅ Parent container created and added");

  // Connect screen manager to parent container
  setParentContainer(parentContainer);

  // Initialize all screen components
  initializeScreens();
  debugLog("✅ Screen components initialized");

  // Set up key handling
  getKeyHandler().on("keypress", handleKeyPress);

  process.on("SIGINT", () => {
    cleanupApp();
    process.exit(0);
  });

  // Check authentication and show appropriate screen
  debugLog("🔍 Checking authentication...");
  cliToken = loadToken();
  debugLog(`🔑 Token loaded: ${cliToken ? "YES" : "NO"}`);

  if (await isAuthenticated()) {
    debugLog("✅ User authenticated, getting user data...");
    currentUser = await getCurrentUser();
    debugLog(`👤 Current user: ${currentUser?.name || "Unknown"}`);
    debugLog("🎯 Showing splash screen...");
    mainMenuScreen.showSplashScreen();
  } else {
    debugLog("❌ User not authenticated, showing login screen...");
    authScreens.showLoginScreen();
  }

  debugLog("🎯 CLI initialization complete");
}

run();
