export * from "./svg";
export * from "./keybinds";

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type Organization = {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
};

export type Invitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "canceled" | string;
  organizationId?: string;
  organization?: { id: string; name?: string };
};

export type EnvVar = {
  id?: string;
  key: string;
  value: string;
  description?: string;
  environmentName?: string;
};

export type Project = {
  id: string;
  name: string;
  logoUrl?: string | null;
  ownerId?: string;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  envs?: EnvVar[];
  envCount?: number;
};

export type AppError = {
  message?: string;
  code?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export type ProjectsListData = {
  personal: Project[];
  org: Project[];
  orgs?: { organizationId: string; organizationName: string | null; projects: Project[] }[];
};

export type CreateProjectPayload = {
  name: string;
  logoUrl?: string;
  organizationId?: string;
  envs?: { key: string; value: string; description?: string; environmentName?: string }[];
};

export type SaveController = {
  save: () => Promise<void>;
  isDirty: () => boolean;
};
