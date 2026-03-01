import { VideoPage } from "@/frontend/modules/video/video-page";

export const metadata = {
  title: "Watch upload | BITStream",
  description: "Watch approved or reviewable BITStream media.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VideoPage slug={id} />;
}
