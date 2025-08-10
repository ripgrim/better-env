import { ProjectEnvPage } from "@/components/project-env-page"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project",
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectEnvPage projectId={slug} />
}
