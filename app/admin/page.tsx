import { AdminDashboard } from "@/frontend/modules/admin/admin-dashboard";

export const metadata = {
  title: "Admin moderation | BITStream",
  description: "Review pending uploads and publish approved student content.",
};

export const dynamic = "force-dynamic";

export default function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminDashboard searchParams={searchParams} />;
}
