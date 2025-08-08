import { ProjectEnvPage } from "@/components/project-env-page"

interface PageProps {
  params: {
    slug: string
  }
}

export default function ProjectPage({ params }: PageProps) {
  return <ProjectEnvPage projectName={params.slug} />
}
