export type KeybindActionKey = "openNewProject" | "addEnvs";

export type KeybindDefinition = {
  description: string;
  modifier: string;
  action: string;
};

export const KEYBINDS: Record<KeybindActionKey, KeybindDefinition> = {
  openNewProject: {
    description: "New Project",
    modifier: "shift",
    action: "n",
  },
  addEnvs: {
    description: "Add Envs",
    modifier: "shift",
    action: "a",
  },
}
