import { ApplicationDetailsClient } from "@/components/applications/application-details-client";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationDetailsClient applicationId={id} />;
}
