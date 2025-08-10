"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { ProjectCard } from "@/components/project-card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@better-env/auth/client";
import type { ProjectsListData, Project } from "@/types";

export function ProjectsList() {
  const activeOrg = authClient.useActiveOrganization();
  const q = useQuery(trpc.projects.list.queryOptions({ organizationId: activeOrg.data?.id ?? null }));
  if (process.env.NODE_ENV !== 'production' && q.data) {
    const data = q.data.data as ProjectsListData | undefined;
    const personal = data?.personal ?? [];
    const org = data?.org ?? [];
    const allProjects = [...org, ...personal].map((p: Project) => ({ id: p.id, name: p.name, organizationId: (p as Project).organizationId ?? null }));
    // eslint-disable-next-line no-console
    console.log("projects.list", JSON.stringify({ personalCount: personal.length, orgCount: org.length, personal, org, allProjects }, null, 2));
  }

  if (q.isPending) return <div className="flex items-center gap-2 text-sm text-text-secondary"><Spinner size={16} /> Loading projects…</div>;
  if (q.error) return <div className="text-sm text-red-500">Failed to load projects</div>;

  const data = q.data?.data as ProjectsListData | undefined;
  const personal = data?.personal ?? [];
  const org = data?.org ?? [];

  if (personal.length === 0 && org.length === 0) {
    return <div className="text-text-secondary text-sm">No projects yet.</div>;
  }

  return (
    <div className="space-y-8">
      {/* {debug.data && (
        <pre className="text-xs p-3 rounded-md bg-muted/30 overflow-auto max-h-48">
{JSON.stringify(debug.data.data, null, 2)}
        </pre>
      )} */}
      {org.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {org.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as unknown as { envCount?: number }).envCount ?? 0}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      {personal.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personal.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as unknown as { envCount?: number }).envCount ?? 0}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


