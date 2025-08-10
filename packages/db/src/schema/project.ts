import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user, organization } from "./auth";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => {
    return {
      ownerNameUnique: uniqueIndex("project_owner_name_unique").on(
        table.ownerId,
        table.name
      ),
      orgNameUnique: uniqueIndex("project_org_name_unique").on(
        table.organizationId,
        table.name
      ),
    };
  }
);

export const environmentVariable = pgTable("env_var",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    description: text("description"),
    environmentName: text("environment_name").notNull().default("default"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => {
    return {
      uniquePerProjectEnv: uniqueIndex("env_unique_project_key_env").on(
        table.projectId,
        table.key,
        table.environmentName
      ),
    };
  }
);

