import { AlertCircle, LockKeyhole, MailCheck } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { SiteFooter } from "@/frontend/components/site-footer";
import { loginWithGoogle } from "@/backend/auth/actions";
import { ALLOWED_EMAIL_DOMAIN } from "@/backend/auth/config";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalize(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function withCurtainEntry(next: string) {
  const separator = next.includes("?") ? "&" : "?";
  return `${next}${separator}entry=curtain`;
}

export async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = (await searchParams) || {};
  const next = normalize(resolvedParams.next) || "/";
  const error = normalize(resolvedParams.error);
  const redirectTarget = withCurtainEntry(next);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <Navbar />

      <main className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(10,13,20,0.9) 12%, rgba(10,13,20,0.52) 44%, rgba(10,13,20,0.82) 100%), url('/login-assets/projector-login.jpg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(248,231,184,0.42),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.3))]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <section className="w-full max-w-xl rounded-[2.2rem] border border-white/12 bg-[#0b1320]/48 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-8 lg:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#f0d6a8]/30 bg-[#f0d6a8]/12 text-[#f0d6a8] shadow-[0_0_40px_rgba(240,214,168,0.18)]">
              <MailCheck className="h-6 w-6" />
            </div>

            <p className="mt-6 text-center text-xs uppercase tracking-[0.38em] text-[#f0d6a8]">Campus entry</p>
            <h1 className="mt-4 text-center text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Sign in
            </h1>
            <p className="mt-4 text-center text-sm leading-7 text-[#d6dde6] sm:text-base">
              Continue with your <span className="font-semibold text-white">@{ALLOWED_EMAIL_DOMAIN}</span> account.
            </p>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>
                  Access was denied. Sign in with a verified <strong>@{ALLOWED_EMAIL_DOMAIN}</strong> account.
                </span>
              </div>
            )}

            <form action={loginWithGoogle} className="mt-8">
              <input type="hidden" name="redirectTo" value={redirectTarget} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#f0d6a8] px-6 py-4 text-sm font-semibold text-[#111827] transition-all duration-300 hover:bg-[#f7dfb7] hover:shadow-[0_18px_42px_rgba(240,214,168,0.26)]"
              >
                <LockKeyhole className="h-4 w-4" />
                Continue with Google
              </button>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
