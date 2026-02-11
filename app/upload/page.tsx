import { UploadPage } from "@/frontend/modules/upload/upload-page";

export const metadata = {
  title: "Upload media | BITStream",
  description: "Submit media for approval on BITStream.",
};

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <UploadPage searchParams={searchParams} />;
}
