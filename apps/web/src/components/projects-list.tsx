"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/utils/trpc";
import { ProjectCard } from "@/components/project-card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@better-env/auth/client";
import { useCallback } from "react";

// Use the actual API return types instead of forcing conversions
type ApiProject = {
  id: string;
  name: string;
  logoUrl: string | null;
  ownerId: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  envCount: number;
};

type ApiOrganizationData = {
  organizationId: string;
  organizationName: string | null;
  projects: ApiProject[];
};

export function ProjectsList() {
  const activeOrg = authClient.useActiveOrganization();
  const { data: projectsData, isPending, error } = useQuery(trpc.projects.list.queryOptions({ 
    organizationId: activeOrg.data?.id ?? null 
  }));
  
  const personalProjects = projectsData?.personal || [];
  const orgProjects = projectsData?.org || [];
  const organizations = (projectsData?.orgs || []) as ApiOrganizationData[];
  
  // Combine org projects with organization-specific projects for display
  const allOrganizationProjects = [
    ...orgProjects,
    ...organizations.flatMap((organizationData) => organizationData.projects || [])
  ];
  
  const refreshProject = useCallback(async (projectId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: projectId }) }),
      queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() }),
    ]);
  }, []);

  if (process.env.NODE_ENV !== 'production' && projectsData) {
    // eslint-disable-next-line no-console
    console.log("projects.list", JSON.stringify({ 
      personalCount: personalProjects.length, 
      organizationCount: allOrganizationProjects.length, 
      personalProjects, 
      organizationProjects: allOrganizationProjects,
      organizations 
    }, null, 2));
  }

  return (
    <div className="space-y-8">
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner size={16} /> Loading projects…
        </div>
      )}
      
      {error && !isPending && (
        <div className="text-sm text-red-500">Failed to load projects</div>
      )}
      
      {!isPending && !error && personalProjects.length === 0 && allOrganizationProjects.length === 0 && (
        <div className="text-text-secondary text-sm">No projects yet.</div>
      )}

      {/* Organization Projects */}
      {!isPending && !error && allOrganizationProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allOrganizationProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <ProjectCard
                  name={project.name}
                  logoUrl={project.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={project.updatedAt.toISOString()}
                  environmentCount={project.envCount}
                  onRefresh={() => refreshProject(project.id)}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Personal Projects */}
      {!isPending && !error && personalProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <ProjectCard
                  name={project.name}
                  logoUrl={project.logoUrl || undefined}
                  devices={[]}
                  lastSyncTime={project.updatedAt.toISOString()}
                  environmentCount={project.envCount}
                  onRefresh={() => refreshProject(project.id)}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}