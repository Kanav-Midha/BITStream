import { LoginPage } from "@/frontend/modules/auth/login-page";

export const metadata = {
  title: "Sign in | BITStream",
  description: "Sign in with your Goa BITS Google account.",
};

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <LoginPage searchParams={searchParams} />;
}
