import { notFound } from "next/navigation";
import { Heart, PlayCircle, ShieldCheck, UserRound, Eye } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { MediaCard } from "@/frontend/components/media-card";
import { SiteFooter } from "@/frontend/components/site-footer";
import { TrackedVideoPlayer } from "@/frontend/components/tracked-video-player";
import { getCurrentUser } from "@/backend/auth/session";
import { getApprovedMedia, getMediaBySlug } from "@/backend/content/repository";
import { getPreferredThumbnailUrl } from "@/backend/content/thumbnail-utils";
import { formatCompactNumber } from "@/backend/content/utils";
import { PUBLIC_CATEGORY } from "@/backend/content/types";

interface VideoPageProps {
  slug: string;
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

export async function VideoPage({ slug }: VideoPageProps) {
  const user = await getCurrentUser();
  const media = await getMediaBySlug(slug);

  if (!media) {
    notFound();
  }

  const canViewPublicApproved = media.approval.status === "approved" && media.category === PUBLIC_CATEGORY;
  const canViewUnapproved =
    canViewPublicApproved ||
    (media.approval.status === "approved" && Boolean(user)) ||
    (user && (user.role === "admin" || user.email === media.uploader.email));

  if (!canViewUnapproved) {
    notFound();
  }

  const related = (await getApprovedMedia({ category: media.category })).filter((item) => item.id !== media.id).slice(0, 3);
  const embedUrl = getEmbedUrl(media.videoUrl);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <TrackedVideoPlayer
                  category={media.category}
                  description={media.description}
                  durationLabel={media.durationLabel}
                  embedUrl={embedUrl}
                  poster={getPreferredThumbnailUrl({ thumbnailUrl: media.thumbnailUrl, videoUrl: media.videoUrl })}
                  title={media.title}
                  videoId={media.id}
                  videoSlug={media.slug}
                  videoUrl={media.videoUrl}
                />
              </div>

              <div className="rounded-[2rem] border border-border/70 bg-card/50 p-6">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {media.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      media.approval.status === "approved"
                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : "border border-amber-400/20 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {media.approval.status}
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-bold text-foreground">{media.title}</h1>
                <p className="mt-4 text-muted-foreground">{media.description}</p>

                <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {media.uploader.name}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {formatCompactNumber(media.stats.views)} views
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {formatCompactNumber(media.stats.likes)} likes
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {media.durationLabel}
                  </span>
                </div>

                {media.approval.notes && (
                  <div className="mt-6 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Moderator note:</span> {media.approval.notes}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-border/70 bg-card/50 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Submission details</h2>
                </div>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Submitted by</dt>
                    <dd className="mt-1 font-medium text-foreground">{media.uploader.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Submitted on</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {new Date(media.submittedAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tags</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {media.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>

              {related.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">More in {media.category}</h2>
                  <div className="space-y-5">
                    {related.map((item) => (
                      <MediaCard key={item.id} media={item} />
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
