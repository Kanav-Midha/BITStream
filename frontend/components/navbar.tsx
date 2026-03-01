import Link from "next/link";
import { ShieldCheck, Upload } from "lucide-react";
import { getCurrentUser } from "@/backend/auth/session";
import { loginWithGoogle, logoutAction } from "@/backend/auth/actions";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#07111d] shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
            <img src="/icon.svg" alt="BITStream" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground sm:text-lg">BITStream</p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">Streaming from BITS Goa</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/" className="transition-colors hover:text-primary">
            Discover
          </Link>
          {user && (
            <Link href="/snap" className="transition-colors hover:text-primary">
              Snap
            </Link>
          )}
          {user && (
            <Link href="/upload" className="transition-colors hover:text-primary">
              Upload
            </Link>
          )}
          {user && (
            <Link href="/my-uploads" className="transition-colors hover:text-primary">
              My Uploads
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="transition-colors hover:text-primary">
              Review
            </Link>
          )}
        </nav>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden rounded-full border border-border/80 bg-card/70 px-4 py-2 text-right transition-colors hover:border-primary/50 hover:bg-primary/5 sm:block"
              >
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {user.role === "admin" ? "Admin" : "Student"}
                </p>
              </Link>
              <Link
                href={user.role === "admin" ? "/admin" : "/upload"}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 sm:px-4 sm:text-sm"
              >
                {user.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                <span className="hidden sm:inline">{user.role === "admin" ? "Review uploads" : "Upload media"}</span>
                <span className="sm:hidden">{user.role === "admin" ? "Review" : "Upload"}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary sm:px-4 sm:text-sm"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <form action={loginWithGoogle}>
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign in with Google
              </button>
            </form>
          )}
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground md:hidden">
          <Link href="/" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
            Discover
          </Link>
          {user && (
            <Link href="/snap" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
              Snap
            </Link>
          )}
          {user && (
            <Link href="/upload" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
              Upload
            </Link>
          )}
          {user && (
            <Link href="/my-uploads" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
              My Uploads
            </Link>
          )}
          {user && (
            <Link href="/profile" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
              Profile
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:text-primary">
              Review
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
