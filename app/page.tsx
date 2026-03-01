import { HomePage } from "@/frontend/modules/home/home-page";

export const metadata = {
  title: "BITStream | Public and campus media",
  description: "Discover public BITStream uploads without signing in, then unlock the full campus stream after login.",
};

export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <HomePage searchParams={searchParams} />;
}
