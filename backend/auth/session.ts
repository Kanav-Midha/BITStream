import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail, isAllowedCampusEmail } from "@/backend/auth/config";

export type AppUserRole = "student" | "admin";

export interface AppSessionUser {
  email: string;
  name: string;
  image?: string | null;
  role: AppUserRole;
}

function normalizeUser(session: Session | null): AppSessionUser | null {
  const email = session?.user?.email?.toLowerCase();

  if (!email || !isAllowedCampusEmail(email)) {
    return null;
  }

  return {
    email,
    image: session?.user?.image,
    name: session?.user?.name || email.split("@")[0],
    role: isAdminEmail(email) ? "admin" : "student",
  };
}

export async function getCurrentUser() {
  const session = await auth();
  return normalizeUser(session);
}

export async function requireCampusUser(redirectTo = "/upload") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireCampusUser("/admin");

  if (user.role !== "admin") {
    redirect("/?error=admin");
  }

  return user;
}
