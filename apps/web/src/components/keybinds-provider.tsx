"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { KEYBINDS, type KeybindActionKey } from "@/lib/keybinds/keymap";
import type { KeybindActions } from "@/types";

type KeybindsContextValue = {
  actions: KeybindActions;
};

const KeybindsContext = createContext<KeybindsContextValue | undefined>(undefined);

export function KeybindsProvider({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const actions: KeybindActions = useMemo(() => ({
    openNewProject: () => setIsCreateOpen(true),
    addEnvs: () => {
      const btn = document.querySelector<HTMLButtonElement>('[data-keybind-action="addEnvs"]');
      if (btn) btn.click();
    },
    openUserMenu: () => {},
    openWorkspaceMenu: () => {},
  }), []);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    for (const actionKey of Object.keys(KEYBINDS) as KeybindActionKey[]) {
      const def = KEYBINDS[actionKey];
      if (!def) continue;
      if (matchesModifier(event, def.modifier)) {
        const button = document.querySelector<HTMLElement>(`[data-keybind-action="${actionKey}"]`);
        if (button) button.setAttribute("data-pressed", "true");
        if (matchesKey(event, def.action)) {
          if (event.repeat) return;
          event.preventDefault();
          actions[actionKey]();
        }
      }
    }
  }, [actions]);

  const onKeyUp = useCallback((event: KeyboardEvent) => {
    for (const actionKey of Object.keys(KEYBINDS) as KeybindActionKey[]) {
      const def = KEYBINDS[actionKey];
      const button = document.querySelector<HTMLElement>(`[data-keybind-action="${actionKey}"]`);
      if (!def || !button) continue;
      const modActive = matchesModifier(event, def.modifier);
      if (!modActive) button.removeAttribute("data-pressed");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const value = useMemo(() => ({ actions }), [actions]);

  return (
    <KeybindsContext.Provider value={value}>
      {children}
      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </KeybindsContext.Provider>
  );
}

export function useKeybindActions() {
  const ctx = useContext(KeybindsContext);
  if (!ctx) throw new Error("useKeybindActions must be used within KeybindsProvider");
  return ctx.actions;
}

function matchesModifier(event: KeyboardEvent, modifier: string) {
  const parts = modifier.toLowerCase().split("+").filter(Boolean);
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt") || parts.includes("option");
  const wantCtrl = parts.includes("ctrl") || parts.includes("control");
  const wantMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("command");
  return (
    !!event.shiftKey === wantShift &&
    !!event.altKey === wantAlt &&
    !!event.ctrlKey === wantCtrl &&
    !!event.metaKey === wantMeta
  );
}

function matchesKey(event: KeyboardEvent, key: string) {
  const lower = key.toLowerCase();
  const eventKey = (event.key || '').toLowerCase();
  const eventCode = (event.code || '').toLowerCase();
  if (/^[0-9]$/.test(lower)) return eventCode === `digit${lower}` || eventKey === lower;
  if (/^[a-z]$/.test(lower)) return eventCode === `key${lower}` || eventKey === lower;
  return eventKey === lower;
}

function attemptSwitchWorkspace(index: number) {}


