import { ProfilePage } from "@/frontend/modules/profile/profile-page";

export const metadata = {
  title: "Your profile | BITStream",
  description: "Personal watch history, engagement, and content analytics.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <ProfilePage />;
}
