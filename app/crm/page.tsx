import dynamic from "next/dynamic";

const ProjectsPageClient = dynamic(
  () => import("@/components/projects/ProjectsPageClient").then((m) => m.ProjectsPageClient),
  { ssr: false }
);

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
