import Link from "next/link";
import { Clock3, ShieldCheck, XCircle } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { MediaThumbnail } from "@/frontend/components/media-thumbnail";
import { SiteFooter } from "@/frontend/components/site-footer";
import { requireCampusUser } from "@/backend/auth/session";
import { getMedia } from "@/backend/content/repository";
import type { MediaItem } from "@/backend/content/types";

function tone(status: "pending" | "approved" | "rejected") {
  switch (status) {
    case "approved":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "rejected":
      return "border-red-400/20 bg-red-500/10 text-red-200";
    default:
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }
}

export async function MyUploadsPage() {
  const user = await requireCampusUser("/my-uploads");
  let uploads: MediaItem[] = [];
  let loadError = "";

  try {
    uploads = await getMedia({ uploaderEmail: user.email });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load your uploads right now. Please try again in a moment.";
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2rem] border border-border/70 bg-card/50 p-8">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">My submissions</p>
            <h1 className="mt-3 text-4xl font-bold text-foreground">Track everything you have uploaded</h1>
            <p className="mt-4 text-muted-foreground">
              Review status, moderator notes, and public availability for your content.
            </p>
          </section>

          {loadError && (
            <section className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">
              Unable to load your submissions. {loadError}
            </section>
          )}

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {uploads.map((upload) => (
              <article key={upload.id} className="flex h-full flex-col rounded-[2rem] border border-border/70 bg-card/40 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                <div className="space-y-5">
                  <MediaThumbnail
                    src={upload.thumbnailUrl}
                    videoUrl={upload.videoUrl}
                    alt={upload.title}
                    className="aspect-video w-full rounded-3xl border border-border/70 object-cover"
                  />
                  <div className="flex h-full flex-col space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{upload.category}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">{upload.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{upload.description}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${tone(upload.approval.status)}`}
                      >
                        {upload.approval.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        {upload.approval.status === "approved" ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : upload.approval.status === "rejected" ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Clock3 className="h-4 w-4" />
                        )}
                        {upload.approval.status}
                      </span>
                      <span>Submitted {new Date(upload.submittedAt).toLocaleString()}</span>
                    </div>

                    {upload.approval.notes && (
                      <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Reviewer note:</span> {upload.approval.notes}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {uploads.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center md:col-span-2 xl:col-span-3">
                <p className="text-lg font-semibold text-foreground">No uploads yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your pending and approved submissions will appear here after the first upload.
                </p>
                <Link
                  href="/upload"
                  className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Upload your first video
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
