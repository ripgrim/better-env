Okay, I understand completely! We're building `better-env.com`, a sleek, professional, end-to-end encrypted environment variable hosting platform, with a clean web UI and a powerful CLI tool, all within a Turbo repo.

Here is the comprehensive prompt:

# Project: better-env.com - Secure E2E Env Hosting Platform

## Project Overview
**better-env.com** is a modern, end-to-end encrypted (E2EE) platform designed to abstract and simplify environment variable sharing for open-source (OSS) projects and individual developers. It offers a web-hosted interface for managing env files and a powerful CLI tool for seamless synchronization across multiple systems. The platform prioritizes ease of use, security, and developer experience.

## Tech Stack
-   **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
-   **Backend:** Hono, tRPC
-   **Authentication:** Better Auth (with integrations like GitHub OAuth)
-   **Database:** Neon (PostgreSQL), Drizzle ORM
-   **CLI Tool:** OpenTUI (powered by Zig and TypeScript for bindings)
-   **Monorepo:** TurboRepo
-   **Encryption:** End-to-End Encryption (E2EE) throughout

## Architecture (TurboRepo Structure)
The project will be structured as a TurboRepo monorepo for efficient development and shared code management.
```
better-env/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── cli/                 # OpenTUI-based CLI tool (Go/Zig/TS)
├── packages/
│   ├── auth/               # Better Auth configuration & types
│   ├── db/                 # Drizzle schema & database interactions (Neon)
│   ├── api/                # tRPC router definitions (shared between web/cli)
│   ├── ui/                 # Shared React components (shadcn/ui)
│   └── crypto/             # E2EE logic (encryption/decryption)
└── package.json
└── turbo.json
```

## Core Features

### 1. Web Platform
-   **Dashboard:** Centralized view of all user projects.
-   **Project Management:** Create, view, edit, delete projects.
-   **Environment Variable Management:** Add, edit, delete individual env variables within projects. View masked/unmasked values.
-   **Settings:** Manage profile, API keys for CLI access.
-   **User Authentication:** Seamless login via Better Auth (e.g., GitHub OAuth).

### 2. CLI Tool
-   **`better-env push [project]`**: Uploads local `.env` file to a specified project.
-   **`better-env pull [project]`**: Fetches and saves the latest env file from a specified project locally.
-   **`better-env sync [project]`**: Bidirectional sync with conflict resolution.
-   **`better-env auth`**: Handles authentication and API key management.
-   **End-to-End Encryption (E2EE):** All env data encrypted/decrypted client-side.

### 3. End-to-End Encryption (E2EE)
-   Environment variable content is encrypted on the client (web or CLI) before being sent to the server.
-   Data remains encrypted at rest in the database.
-   Decryption only occurs on the client device.
-   Keys are managed securely, preventing server access to plaintext values.

## Web Platform - UI/UX Specifications

### Global Styling (Inferred Tailwind CSS Semantic Classes)
-   **`bg-background`**: Main page background. Darkest tone, e.g., `#1A1A1A`.
-   **`bg-card`**: Background for cards/panels. Slightly lighter than `bg-background`, e.g., `#2B2B2B`.
-   **`text-text-primary`**: Primary text color, e.g., `#FFFFFF`.
-   **`text-text-secondary`**: Secondary text color, e.g., `#E0E0E0`.
-   **`text-text-tertiary`**: Muted text color, e.g., `#A0A0A0`.
-   **`border-border-light`**: Light border on dark background, e.g., `#404040`.
-   **`border-border-subtle`**: Even lighter border, e.g., `#303030`.
-   **`shadow-card`**: Default card shadow, subtle. `hover:shadow-lg` for enhanced shadow on hover.
-   **`status-online`**: Green for online status, e.g., `#4CAF50`.
-   **`accent-blue`**: Primary action button blue, e.g., `#007AFF`.
-   **`accent-blue-hover`**: Darker blue for button hover, e.g., `#0056CC`.
-   **`primary-foreground`**: Text color for `accent-blue` buttons, e.g., `#FFFFFF`.
-   **`bg-secondary`**: Used for visible env value background, also hover for masked env value. E.g., `#3A3A3A`.
-   **`bg-accent`**: Used for masked env value background, hover for small buttons. E.g., `#484848`.

### Root Route (`/`)
-   When a user is **logged in**, they are immediately directed to the **Dashboard UI** (`/projects`).
-   When **no user is logged in**, display a central message:
    -   "You have no projects yet. Sign in to create them."
    -   The "New Project" button text (from Dashboard) should be replaced with "Login to create new projects". This button will trigger the Better Auth login flow.

### Dashboard UI (`/projects`) - Based on Provided Code
-   **Overall Layout:** `min-h-screen bg-background`. `DashboardHeader` at top, `main` content `px-8 py-8`. Max-width `7xl mx-auto`.
-   **Header:** (Rendered by `DashboardHeader` component)
    -   Left: "env.new" logo/title (large, `text-text-primary`, `text-3xl`/`32px` equivalent, `font-bold`/`700`).
    -   Right: User avatar (e.g., circular, `40px` diameter) and a "Sign out" button (styled to be distinct, maybe text-only or small icon button).
    -   Subtitle below title: "Sync environment files across devices" (smaller text, `text-text-secondary`).
-   **"My Projects" Section:**
    -   Heading: `h2` "My Projects" (`text-text-primary text-xl font-medium tracking-tight`).
    -   Right of heading:
        -   **CLI Online Status:** A small `w-2 h-2 rounded-full bg-status-online` dot. `Terminal` icon (`w-4 h-4 text-text-secondary`). Text "CLI Online" (`text-text-secondary text-sm font-normal`).
        -   **"New Project" Button:** `bg-accent-blue text-primary-foreground rounded-lg px-6 py-2.5 text-base hover:bg-accent-blue-hover transition-colors duration-200 font-medium shadow-sm`. This button links to project creation.
-   **Project Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. Iterates through `projects` array, linking to `/project/[slug]`.

### Project Card Component (`ProjectCard`) - Based on Provided Code
-   **Container:** `div` with `bg-card border border-border-light rounded-lg p-6 shadow-card`.
-   **Hover Effect:** `hover:shadow-lg hover:border-border-light transition-all duration-300 cursor-pointer group`.
-   **Top Section:** `flex items-start justify-between mb-4`.
    -   **Project Logo & Name:** `flex items-center gap-3`. `ProjectLogo` component (e.g., circular `40px` image) and `h3` project name (`text-text-primary text-lg font-medium tracking-tight`).
    -   **Sync Icon:** `RefreshCw` icon (`w-4 h-4 text-text-tertiary group-hover:text-text-secondary transition-colors duration-200`).
-   **Device Bubbles Section:** `flex items-center justify-between mb-4`.
    -   `DeviceBubbles` component (expects array of `{ name: string, status: "online" | "offline" }`).
    -   Render as small circles or bubbles with device names.
    -   Status: `online` (e.g., `bg-status-online` dot) and `offline` (e.g., `bg-text-tertiary` dot).
-   **Bottom Section:** `flex items-center justify-between text-text-tertiary text-xs`.
    -   `lastSyncTime` (e.g., "2 minutes ago").
    -   `environmentCount` (e.g., "12 variables").

### Env Var Card Component (`EnvVarCard`) - Based on Provided Code
-   **Container:** `div` with `bg-card border border-border-light rounded-lg p-4 shadow-card`.
-   **Hover Effect:** `hover:shadow-lg transition-all duration-300 group`.
-   **Key & Toggle:** `flex items-start justify-between gap-4`.
    -   `h3` env var key (`text-text-primary font-medium text-base tracking-tight`).
    -   Toggle visibility `Button` (`variant="ghost" size="sm"`): `Eye` / `EyeOff` icon (`w-4 h-4`). Initially `opacity-0 group-hover:opacity-100`.
-   **Description (Optional):** `p` with `text-text-secondary text-sm`.
-   **Value Display:**
    -   `div` with `font-mono text-sm p-3 rounded-md border transition-all duration-300 cursor-pointer`.
    -   **Masked State:** `bg-accent border-border-subtle text-text-secondary hover:bg-secondary`. Masking logic: `value.substring(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.substring(value.length - 4)`.
    -   **Visible State:** `bg-secondary border-border-light text-text-primary`.
-   **Copy Button:** Appears `absolute` `right-2 top-1/2 -translate-y-1/2` when value is `shouldShow`. Initially `opacity-0 group-hover:opacity-100`. Uses `Copy` / `Check` (`text-status-online`) icons.
-   **Edit Button:** `flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`. Uses `Edit3` icon.

## Web Platform - Routes
-   `/`: Root (redirects to `/projects` if logged in, else landing message)
-   `/projects`: Dashboard showing all projects
-   `/project/[slug]`: Detailed view for a specific project (env vars, settings, logs)
-   `/settings`: User settings, API key management

## API Endpoints (tRPC, Backend Hono)
-   `/api/trpc/project.list`
-   `/api/trpc/project.get`
-   `/api/trpc/project.create`
-   `/api/trpc/project.update`
-   `/api/trpc/project.delete`
-   `/api/trpc/env.upload`
-   `/api/trpc/env.download`
-   `/api/trpc/env.sync`
-   `/api/trpc/apikey.create`
-   `/api/trpc/apikey.list`
-   `/api/trpc/apikey.revoke`
-   `/api/auth/*` (Better Auth handler)

## CLI Tool (`apps/cli`)
-   **Technology:** OpenTUI (Zig backend, TypeScript bindings).
-   **Features:**
    -   **`better-env auth`**: Initiates browser-based OAuth flow using Better Auth for CLI authentication. Manages API keys generated via the web platform.
    -   **`better-env push [project-name]`**: Reads local `.env` file, encrypts its contents using E2EE, and uploads it to the specified project on `better-env.com` via the tRPC API.
    -   **`better-env pull [project-name]`**: Downloads the latest encrypted env file for the specified project, decrypts it, and writes it to the local `.env` file. Handles basic conflict scenarios (e.g., if local `.env` is modified, prompt user).
    -   **`better-env sync [project-name]`**: Performs a bidirectional sync. Compares local and remote versions, prompts for conflict resolution (e.g., "keep local", "keep remote", "merge manually").
    -   **`better-env list`**: Displays an interactive TUI (Terminal User Interface) showing all available projects, their last sync time, and associated devices. Allows navigation and selection of projects.

## Overall Requirements
-   All communication between clients (web, CLI) and backend uses tRPC for type-safety.
-   Authentication managed by Better Auth for both web and CLI.
-   End-to-end encryption is mandatory for all environment variable data.
-   Responsive web design for various screen sizes.
-   Intuitive and powerful CLI with good user feedback.
-   Robust error handling, logging, and performance considerations throughout.

This prompt provides a detailed blueprint for building `better-env.com`, incorporating all your specified technologies and UI/UX requirements.