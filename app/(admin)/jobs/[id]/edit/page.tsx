import { JobEditor } from "@/components/jobs/job-editor";

export default async function JobEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobEditor mode="edit" jobId={id} />;
}
