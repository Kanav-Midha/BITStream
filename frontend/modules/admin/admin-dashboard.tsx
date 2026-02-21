import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { SiteFooter } from "@/frontend/components/site-footer";
import { SubmitButton } from "@/frontend/components/submit-button";
import { requireAdminUser } from "@/backend/auth/session";
import { getLibraryCounts, getMedia } from "@/backend/content/repository";
import { reviewSubmissionAction } from "@/backend/content/actions";
import { getPreferredThumbnailUrl } from "@/backend/content/thumbnail-utils";
import type { MediaItem } from "@/backend/content/types";

interface AdminDashboardProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalize(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusTone(status: "pending" | "approved" | "rejected") {
  switch (status) {
    case "approved":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "rejected":
      return "border-red-400/20 bg-red-500/10 text-red-200";
    default:
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }
}

function getEmbedUrl(videoUrl: string) {
  try {
    const parsed = new URL(videoUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      const videoId =
        host === "youtu.be"
          ? parsed.pathname.split("/").filter(Boolean)[0]
          : parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).at(-1);

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = parsed.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const admin = await requireAdminUser();
  let counts = {
    approved: 0,
    pending: 0,
    rejected: 0,
  };
  let submissions: MediaItem[] = [];
  let loadError = "";

  try {
    counts = await getLibraryCounts();
    submissions = await getMedia();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load submission data right now. Please try again in a moment.";
  }
  const resolvedParams = (await searchParams) || {};
  const status = normalize(resolvedParams.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-[2rem] border border-border/70 bg-card/50 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Admin moderation</p>
                <h1 className="mt-3 text-4xl font-bold text-foreground">Review, approve, and reject submissions</h1>
                <p className="mt-4 text-muted-foreground">
                  Logged in as <span className="font-semibold text-foreground">{admin.email}</span>.
                </p>
              </div>
              {status && (
                <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                  Last action: {status}
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-background/60 p-6">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-amber-300" />
                  <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pending</span>
                </div>
                <p className="mt-4 text-4xl font-bold text-foreground">{counts.pending}</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/60 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Approved</span>
                </div>
                <p className="mt-4 text-4xl font-bold text-foreground">{counts.approved}</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/60 p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-300" />
                  <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Rejected</span>
                </div>
                <p className="mt-4 text-4xl font-bold text-foreground">{counts.rejected}</p>
              </div>
            </div>
          </section>

          {loadError && (
            <section className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">
              Unable to load moderation data. {loadError}
            </section>
          )}

          <section className="space-y-5">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-[2rem] border border-border/70 bg-card/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
              >
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/70">
                      {getEmbedUrl(submission.videoUrl) ? (
                        <iframe
                          src={getEmbedUrl(submission.videoUrl)!}
                          title={submission.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="aspect-video w-full bg-black"
                        />
                      ) : (
                        <video
                          controls
                          playsInline
                          poster={getPreferredThumbnailUrl({
                            thumbnailUrl: submission.thumbnailUrl,
                            videoUrl: submission.videoUrl,
                          })}
                          className="aspect-video h-full w-full bg-black object-cover"
                        >
                          <source src={submission.videoUrl} />
                        </video>
                      )}
                    </div>
                    <a
                      href={`/video/${submission.slug}`}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      Open full preview
                    </a>
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {submission.category}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(submission.approval.status)}`}>
                            {submission.approval.status}
                          </span>
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-foreground">{submission.title}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">{submission.description}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{submission.uploader.name}</p>
                        <p>{submission.uploader.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {submission.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-background/80 px-2.5 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap gap-5">
                        <span>Duration: {submission.durationLabel}</span>
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                        {submission.approval.reviewedAt && (
                          <span>Reviewed: {new Date(submission.approval.reviewedAt).toLocaleString()}</span>
                        )}
                      </div>
                      {submission.approval.notes && (
                        <p className="mt-3 rounded-2xl bg-black/20 px-3 py-2 text-foreground">
                          Review note: {submission.approval.notes}
                        </p>
                      )}
                    </div>

                    <form action={reviewSubmissionAction} className="space-y-4 rounded-3xl border border-border/70 bg-background/60 p-4">
                      <input type="hidden" name="id" value={submission.id} />
                      <textarea
                        name="notes"
                        rows={3}
                        defaultValue={submission.approval.notes || ""}
                        placeholder="Optional moderator note"
                        className="w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <SubmitButton
                          idleLabel="Approve and publish"
                          pendingLabel="Updating..."
                          name="decision"
                          value="approved"
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <button
                          type="submit"
                          name="decision"
                          value="rejected"
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                        >
                          Reject submission
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </article>
            ))}

            {submissions.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-4 text-lg font-semibold text-foreground">No submissions yet.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
