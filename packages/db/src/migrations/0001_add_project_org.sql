ALTER TABLE "project"
  ADD COLUMN IF NOT EXISTS "organization_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "project_org_name_unique" ON "project" ("organization_id", "name");

ALTER TABLE "project"
  ADD CONSTRAINT "project_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL;







