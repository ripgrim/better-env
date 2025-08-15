"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/utils/trpc";
import { ProjectCard } from "@/components/project-card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@better-env/auth/client";
import type { ProjectsListData, Project } from "@/types";
import { useCallback, useMemo } from "react";

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
  const data = q.data?.data as ProjectsListData | undefined;
  const personal = data?.personal ?? [];
  const org = data?.org ?? [];

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
  }, []);

  const orgWithHandlers = useMemo(() => org.map((p) => ({
    project: p,
    onRefresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: p.id }) }),
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() }),
      ]);
    },
  })), [org]);

  const personalWithHandlers = useMemo(() => personal.map((p) => ({
    project: p,
    onRefresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: p.id }) }),
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() }),
      ]);
    },
  })), [personal]);

  return (
    <div className="space-y-8">
      {q.isPending && (
        <div className="flex items-center gap-2 text-sm text-text-secondary"><Spinner size={16} /> Loading projects…</div>
      )}
      {q.error && !q.isPending && (
        <div className="text-sm text-red-500">Failed to load projects</div>
      )}
      {!q.isPending && !q.error && personal.length === 0 && org.length === 0 && (
        <div className="text-text-secondary text-sm">No projects yet.</div>
      )}
      {/* {debug.data && (
        <pre className="text-xs p-3 rounded-md bg-muted/30 overflow-auto max-h-48">
{JSON.stringify(debug.data.data, null, 2)}
        </pre>
      )} */}
      {!q.isPending && !q.error && orgWithHandlers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgWithHandlers.map(({ project: p, onRefresh }) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as unknown as { envCount?: number }).envCount ?? 0}
                  onRefresh={onRefresh}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      {!q.isPending && !q.error && personalWithHandlers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalWithHandlers.map(({ project: p, onRefresh }) => (
              <Link key={p.id} href={`/project/${p.id}`}>
                <ProjectCard
                  name={p.name}
                  logoUrl={p.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={(p.updatedAt ?? p.createdAt) as unknown as string}
                  environmentCount={(p as unknown as { envCount?: number }).envCount ?? 0}
                  onRefresh={onRefresh}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


