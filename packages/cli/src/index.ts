import fs from "fs";
import {
  CliRenderer,
  createCliRenderer,
  GroupRenderable,
  TextRenderable,
  SelectRenderableEvents,
  type SelectOption,
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
import {
  colors,
  createBox,
  createText,
  createSelect,
  centerX,
  createLogo,
} from "./ui/ui";

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

function showWelcomeScreen() {
  debugLog("👋 Showing welcome screen...");
  clearScreen();
  setCurrentScreen("welcome");

  if (!parentContainer || !renderer) return;

  // Logo - centered properly with ASCII art width
  const logoWidth = 76; // Width of the ASCII art
  const logo = createLogo(renderer, {
    left: centerX(renderer, logoWidth),
    top: 5,
  });
  addElement(logo);

  const descText = createText(
    "welcome-desc",
    "Securely manage your environment variables across projects",
    { left: centerX(renderer, 60), top: 13 },
    { fg: colors.secondary, bg: colors.selectBg }
  );
  addElement(descText);

  const welcomeOptions: SelectOption[] = [
    {
      name: "Login",
      description: "Authenticate with your better-env account",
      value: "login",
    },
    {
      name: "Learn More",
      description: "Visit better-env.com to learn about the platform",
      value: "learn",
    },
    { name: "Exit", description: "Quit the CLI", value: "exit" },
  ];

  const welcomeSelect = createSelect(
    "welcome-select",
    welcomeOptions,
    {
      left: centerX(renderer, 80),
      top: 16,
    },
    {
      width: 80,
      height: 6
    }
  );
  
  welcomeSelect.on(
    SelectRenderableEvents.ITEM_SELECTED,
    (index: number, option: SelectOption) => {
      handleDebouncedSelection(async () => {
        switch (option.value) {
          case "login":
            debugLog("👤 User selected login");
            authScreens.showLoginScreen();
            break;
          case "learn":
            debugLog("📚 User selected learn more");
            const command =
              process.platform === "darwin"
                ? "open"
                : process.platform === "win32"
                  ? "start"
                  : "xdg-open";
            try {
              require("child_process").exec(
                `${command} "https://better-env.com"`
              );
              debugLog("🌐 Opened better-env.com");
            } catch (error) {
              debugLog(`❌ Failed to open browser: ${error}`);
            }
            // Stay on welcome screen after opening browser
            break;
          case "exit":
            debugLog("🚪 User selected exit");
            process.exit(0);
            break;
        }
      });
    }
  );

  addElement(welcomeSelect);

  const hintText = createText(
    "welcome-hint",
    "↑↓: Navigate | Enter: Select | Ctrl+C: Exit",
    { left: centerX(renderer, 40), top: 26 },
    { fg: colors.muted }
  );
  addElement(hintText);

  // Auto-focus
  setTimeout(() => {
    if (welcomeSelect) {
      welcomeSelect.focus();
    }
  }, 100);
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
      case "welcome":
        process.exit(0);
        break;
      case "main":
        mainMenuScreen.showSplashScreen();
        break;
      case "projects":
      case "profile":
      case "settings":
        mainMenuScreen.showMainMenu();
        break;
      case "login":
      case "getting-code":
        showWelcomeScreen();
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

  if (getCurrentScreen() === "welcome") {
    // Welcome screen uses select interface - no manual key handling needed
    return;
  }

  if (getCurrentScreen() === "splash") {
    mainMenuScreen.showMainMenu();
    return;
  }

  if (getCurrentScreen() === "login" || getCurrentScreen() === "getting-code") {
    // Login screen uses select interface - no manual key handling needed
    return;
  }

  if (getCurrentScreen() === "device-auth") {
    if (key.name === "o") {
      // Open browser with auto-filled code
      if ((global as any).openBrowserWithCode) {
        (global as any).openBrowserWithCode();
      }
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

  // Show welcome screen instead of auto-checking authentication
  debugLog("👋 Showing welcome screen...");
  showWelcomeScreen();

  debugLog("🎯 CLI initialization complete");
}

run();
