import { getCurrentUser } from "@/backend/auth/session";
import { listActiveSnaps } from "@/backend/snap/service";
import { cloudinaryUploadsEnabled } from "@/backend/storage/file-uploads";
import { Navbar } from "@/frontend/components/navbar";
import { SiteFooter } from "@/frontend/components/site-footer";
import { SnapPage } from "@/frontend/modules/snap/snap-page";

export const metadata = {
  title: "Snap | BITStream",
  description: "24-hour campus snaps, reactions, and quick comments for BITS Goa.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  const directUploadEnabled = cloudinaryUploadsEnabled() || process.env.VERCEL !== "1";
  const initialFeed = user
    ? await listActiveSnaps(user.email).catch((error) => ({
        enabled: false,
        items: [],
        reason: error instanceof Error ? error.message : "Unable to load Snap right now.",
      }))
    : {
        enabled: false,
        items: [],
        reason: "Sign in from the top-right corner to post and view live snaps.",
      };

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('/homepage-assets/film-texture.jpg')",
            backgroundPosition: "top center",
            backgroundRepeat: "repeat-y",
            backgroundSize: "100% auto",
          }}
        />
        <SnapPage directUploadEnabled={directUploadEnabled} initialFeed={initialFeed} viewerSignedIn={Boolean(user)} />
      </main>
      <SiteFooter />
    </div>
  );
}
