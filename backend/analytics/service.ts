import type { AppSessionUser } from "@/backend/auth/session";
import { getMedia } from "@/backend/content/repository";
import { analyticsEnabled, getAnalyticsAdminClient } from "@/backend/analytics/client";
import type {
  AnalyticsChartDatum,
  PopularContentItem,
  TrackWatchEventInput,
  UserAnalyticsResult,
  UserHistoryItem,
} from "@/backend/analytics/types";
import { clampPercentage } from "@/backend/analytics/utils";

type WatchEventRow = {
  current_time_seconds: number | null;
  duration_seconds: number | null;
  event_type: string;
  media_category: string | null;
  media_slug: string;
  media_title: string;
  occurred_at: string;
  progress_percent: number | null;
  session_id: string;
  user_email: string;
  watch_seconds: number | null;
};

const EMPTY_ANALYTICS: UserAnalyticsResult = {
  enabled: false,
  overview: {
    titlesWatched: 0,
    totalWatchSeconds: 0,
    averageCompletion: 0,
    sessionsCount: 0,
    favoriteCategory: "No activity yet",
    uploadedCount: 0,
    approvedUploads: 0,
  },
  recentHistory: [],
  categoryBreakdown: [],
  dailyEngagement: [],
  popularContent: [],
};

function formatAnalyticsSetupReason(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("etimedout")
  ) {
    return "";
  }

  if (
    normalized.includes("user_profiles") ||
    normalized.includes("media_watch_events") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "Supabase is connected, but the analytics tables are missing. Run database/supabase/analytics-schema.sql in the Supabase SQL editor, then redeploy.";
  }

  return message;
}

export async function ensureAnalyticsProfile(user: AppSessionUser) {
  const supabase = getAnalyticsAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_email: user.email,
      display_name: user.name,
      avatar_url: user.image || null,
      role: user.role,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_email",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function recordWatchEvent(user: AppSessionUser, input: TrackWatchEventInput) {
  const supabase = getAnalyticsAdminClient();

  if (!supabase) {
    return { enabled: false };
  }

  await ensureAnalyticsProfile(user);

  const { error } = await supabase.from("media_watch_events").insert({
    current_time_seconds: input.currentTimeSeconds ?? null,
    duration_seconds: input.durationSeconds ?? null,
    event_type: input.eventType,
    media_category: input.mediaCategory || null,
    media_id: input.mediaId || null,
    media_slug: input.mediaSlug,
    media_title: input.mediaTitle,
    metadata: input.metadata || {},
    occurred_at: new Date().toISOString(),
    progress_percent: input.progressPercent ?? null,
    session_id: input.sessionId,
    user_email: user.email,
    video_url: input.videoUrl || null,
    watch_seconds: Math.max(0, Math.round(input.watchSeconds || 0)),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { enabled: true };
}

function buildRecentHistory(events: WatchEventRow[]): UserHistoryItem[] {
  const grouped = new Map<string, UserHistoryItem>();

  for (const event of events) {
    const current = grouped.get(event.media_slug);
    const nextProgress = clampPercentage(event.progress_percent);

    if (!current) {
      grouped.set(event.media_slug, {
        mediaSlug: event.media_slug,
        mediaTitle: event.media_title,
        mediaCategory: event.media_category || "Campus Stories",
        watchedAt: event.occurred_at,
        watchSeconds: Math.max(0, event.watch_seconds || 0),
        progressPercent: nextProgress,
      });
      continue;
    }

    current.watchSeconds += Math.max(0, event.watch_seconds || 0);
    current.progressPercent = Math.max(current.progressPercent, nextProgress);
  }

  return Array.from(grouped.values()).slice(0, 8);
}

function buildCategoryBreakdown(events: WatchEventRow[]): AnalyticsChartDatum[] {
  const totals = new Map<string, number>();

  for (const event of events) {
    const category = event.media_category || "Campus Stories";
    totals.set(category, (totals.get(category) || 0) + Math.max(0, event.watch_seconds || 0));
  }

  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 6);
}

function buildDailyEngagement(events: WatchEventRow[]): AnalyticsChartDatum[] {
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() - (6 - index));
    return current.toISOString().slice(0, 10);
  });

  const totals = new Map<string, number>(labels.map((label) => [label, 0]));

  for (const event of events) {
    const key = event.occurred_at.slice(0, 10);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) || 0) + Math.max(0, event.watch_seconds || 0));
    }
  }

  return labels.map((label) => ({
    label: new Date(`${label}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
    value: totals.get(label) || 0,
  }));
}

function buildPopularContent(events: WatchEventRow[]): PopularContentItem[] {
  const grouped = new Map<
    string,
    {
      mediaCategory: string;
      mediaTitle: string;
      sessions: Set<string>;
      totalWatchSeconds: number;
    }
  >();

  for (const event of events) {
    const current = grouped.get(event.media_slug) || {
      mediaCategory: event.media_category || "Campus Stories",
      mediaTitle: event.media_title,
      sessions: new Set<string>(),
      totalWatchSeconds: 0,
    };

    current.sessions.add(`${event.user_email}:${event.session_id}`);
    current.totalWatchSeconds += Math.max(0, event.watch_seconds || 0);
    grouped.set(event.media_slug, current);
  }

  return Array.from(grouped.entries())
    .map(([mediaSlug, value]) => ({
      mediaSlug,
      mediaTitle: value.mediaTitle,
      mediaCategory: value.mediaCategory,
      totalWatchSeconds: value.totalWatchSeconds,
      uniqueViewers: value.sessions.size,
    }))
    .sort((first, second) => {
      if (second.uniqueViewers !== first.uniqueViewers) {
        return second.uniqueViewers - first.uniqueViewers;
      }

      return second.totalWatchSeconds - first.totalWatchSeconds;
    })
    .slice(0, 5);
}

export async function getUserAnalytics(user: AppSessionUser): Promise<UserAnalyticsResult> {
  const uploads = await getMedia({ uploaderEmail: user.email });

  if (!analyticsEnabled()) {
    return {
      ...EMPTY_ANALYTICS,
      reason: "Add Supabase analytics env vars to enable watch history and engagement reporting.",
      overview: {
        ...EMPTY_ANALYTICS.overview,
        approvedUploads: uploads.filter((item) => item.approval.status === "approved").length,
        uploadedCount: uploads.length,
      },
    };
  }

  try {
    const supabase = getAnalyticsAdminClient();

    if (!supabase) {
      return EMPTY_ANALYTICS;
    }

    await ensureAnalyticsProfile(user);

    const [{ data: userEvents, error: userEventsError }, { data: globalEvents, error: globalEventsError }] =
      await Promise.all([
        supabase
          .from("media_watch_events")
          .select(
            "current_time_seconds,duration_seconds,event_type,media_category,media_slug,media_title,occurred_at,progress_percent,session_id,user_email,watch_seconds",
          )
          .eq("user_email", user.email)
          .order("occurred_at", { ascending: false })
          .limit(500),
        supabase
          .from("media_watch_events")
          .select(
            "current_time_seconds,duration_seconds,event_type,media_category,media_slug,media_title,occurred_at,progress_percent,session_id,user_email,watch_seconds",
          )
          .order("occurred_at", { ascending: false })
          .limit(2000),
      ]);

    if (userEventsError) {
      throw new Error(userEventsError.message);
    }

    if (globalEventsError) {
      throw new Error(globalEventsError.message);
    }

    const recentHistory = buildRecentHistory((userEvents || []) as WatchEventRow[]);
    const categoryBreakdown = buildCategoryBreakdown((userEvents || []) as WatchEventRow[]);
    const dailyEngagement = buildDailyEngagement((userEvents || []) as WatchEventRow[]);
    const popularContent = buildPopularContent((globalEvents || []) as WatchEventRow[]);
    const totalWatchSeconds = (userEvents || []).reduce(
      (total, event) => total + Math.max(0, event.watch_seconds || 0),
      0,
    );
    const sessionsCount = new Set((userEvents || []).map((event) => event.session_id)).size;
    const titlesWatched = new Set((userEvents || []).map((event) => event.media_slug)).size;
    const averageCompletion =
      recentHistory.length > 0
        ? recentHistory.reduce((total, item) => total + item.progressPercent, 0) / recentHistory.length
        : 0;
    const favoriteCategory = categoryBreakdown[0]?.label || "No activity yet";

    return {
      enabled: true,
      overview: {
        approvedUploads: uploads.filter((item) => item.approval.status === "approved").length,
        averageCompletion,
        favoriteCategory,
        lastActiveAt: userEvents?.[0]?.occurred_at,
        sessionsCount,
        titlesWatched,
        totalWatchSeconds,
        uploadedCount: uploads.length,
      },
      recentHistory,
      categoryBreakdown,
      dailyEngagement,
      popularContent,
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? formatAnalyticsSetupReason(error.message)
        : "Supabase analytics is configured, but the analytics tables are not ready yet.";

    return {
      ...EMPTY_ANALYTICS,
      reason: reason || undefined,
      overview: {
        ...EMPTY_ANALYTICS.overview,
        approvedUploads: uploads.filter((item) => item.approval.status === "approved").length,
        uploadedCount: uploads.length,
      },
    };
  }
}
