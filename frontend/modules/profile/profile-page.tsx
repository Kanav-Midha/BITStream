import Link from "next/link";
import { BarChart3, Clock3, Flame, History, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { SiteFooter } from "@/frontend/components/site-footer";
import { requireCampusUser } from "@/backend/auth/session";
import { getUserAnalytics } from "@/backend/analytics/service";
import { formatPercentage, formatWatchTime } from "@/backend/analytics/utils";
import { ProfileCharts } from "@/frontend/modules/profile/profile-charts";

function formatISTDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export async function ProfilePage() {
  const user = await requireCampusUser("/profile");
  const analytics = await getUserAnalytics(user);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(9,17,29,0.96),rgba(18,30,48,0.88))] shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
              <div className="space-y-5">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#f0d6a8]">
                  <Sparkles className="h-4 w-4" />
                  Personal analytics
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">{user.name}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c2d0e3] sm:text-base">
                    Watch history, viewing habits, content interests, and your publishing footprint, all in one place.
                  </p>
                </div>

                {!analytics.enabled && analytics.reason && (
                  <div className="rounded-[1.75rem] border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-50">
                    <p className="font-semibold">Supabase analytics is not fully active yet.</p>
                    <p className="mt-2 text-amber-100/90">{analytics.reason}</p>
                    <p className="mt-2 text-amber-100/75">
                      Required file:
                      {" "}
                      <code className="rounded bg-black/20 px-2 py-1 text-xs">database/supabase/analytics-schema.sql</code>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Titles watched</p>
                  <p className="mt-3 text-3xl font-bold text-white">{analytics.overview.titlesWatched}</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Watch time</p>
                  <p className="mt-3 text-3xl font-bold text-white">{formatWatchTime(analytics.overview.totalWatchSeconds)}</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Completion</p>
                  <p className="mt-3 text-3xl font-bold text-white">{formatPercentage(analytics.overview.averageCompletion)}</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Favorite lane</p>
                  <p className="mt-3 text-lg font-semibold text-white">{analytics.overview.favoriteCategory}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-4">
            <div className="rounded-[1.75rem] border border-border/70 bg-card/45 p-5">
              <div className="flex items-center gap-3 text-[#f0d6a8]">
                <Clock3 className="h-5 w-5" />
                <p className="text-xs uppercase tracking-[0.24em]">Sessions</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">{analytics.overview.sessionsCount}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card/45 p-5">
              <div className="flex items-center gap-3 text-[#6b9cff]">
                <UploadCloud className="h-5 w-5" />
                <p className="text-xs uppercase tracking-[0.24em]">Uploads</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">{analytics.overview.uploadedCount}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card/45 p-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-xs uppercase tracking-[0.24em]">Approved</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">{analytics.overview.approvedUploads}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card/45 p-5">
              <div className="flex items-center gap-3 text-rose-300">
                <Flame className="h-5 w-5" />
                <p className="text-xs uppercase tracking-[0.24em]">Last active</p>
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {analytics.overview.lastActiveAt ? `${formatISTDateTime(analytics.overview.lastActiveAt)} IST` : "Not tracked yet"}
              </p>
            </div>
          </section>

          <ProfileCharts
            categoryBreakdown={analytics.categoryBreakdown.length > 0 ? analytics.categoryBreakdown : [{ label: "No data", value: 0 }]}
            dailyEngagement={analytics.dailyEngagement.length > 0 ? analytics.dailyEngagement : [{ label: "Today", value: 0 }]}
          />

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-border/70 bg-card/45 p-6">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Recent watch history</h2>
              </div>
              <div className="mt-5 space-y-4">
                {analytics.recentHistory.length > 0 ? (
                  analytics.recentHistory.map((item) => (
                    <Link
                      key={item.mediaSlug}
                      href={`/video/${item.mediaSlug}`}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-black/15 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#d8bc88]">{item.mediaCategory}</p>
                        <p className="mt-2 text-base font-semibold text-white">{item.mediaTitle}</p>
                        <p className="mt-1 text-sm text-[#aab8cb]">{formatISTDateTime(item.watchedAt)} IST</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatPercentage(item.progressPercent)}</p>
                        <p className="mt-1 text-xs text-[#90a4bf]">{formatWatchTime(item.watchSeconds)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-4 py-10 text-center text-sm text-[#aab8cb]">
                    Start watching from the library and your history will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/45 p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Campus popularity</h2>
              </div>
              <div className="mt-5 space-y-4">
                {analytics.popularContent.length > 0 ? (
                  analytics.popularContent.map((item, index) => (
                    <Link
                      key={item.mediaSlug}
                      href={`/video/${item.mediaSlug}`}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/8 bg-black/15 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex items-start gap-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#f0d6a8]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[#d8bc88]">{item.mediaCategory}</p>
                          <p className="mt-2 text-base font-semibold text-white">{item.mediaTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{item.uniqueViewers} viewers</p>
                        <p className="mt-1 text-xs text-[#90a4bf]">{formatWatchTime(item.totalWatchSeconds)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-4 py-10 text-center text-sm text-[#aab8cb]">
                    Popularity rankings will fill in once watch tracking starts.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
