export type WatchEventType = "opened" | "started" | "heartbeat" | "paused" | "completed";

export interface TrackWatchEventInput {
  sessionId: string;
  mediaId?: string;
  mediaSlug: string;
  mediaTitle: string;
  mediaCategory?: string;
  videoUrl?: string;
  eventType: WatchEventType;
  watchSeconds?: number;
  progressPercent?: number | null;
  durationSeconds?: number | null;
  currentTimeSeconds?: number | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UserAnalyticsOverview {
  titlesWatched: number;
  totalWatchSeconds: number;
  averageCompletion: number;
  sessionsCount: number;
  favoriteCategory: string;
  lastActiveAt?: string;
  uploadedCount: number;
  approvedUploads: number;
}

export interface UserHistoryItem {
  mediaSlug: string;
  mediaTitle: string;
  mediaCategory: string;
  watchedAt: string;
  watchSeconds: number;
  progressPercent: number;
}

export interface AnalyticsChartDatum {
  label: string;
  value: number;
}

export interface PopularContentItem {
  mediaSlug: string;
  mediaTitle: string;
  mediaCategory: string;
  uniqueViewers: number;
  totalWatchSeconds: number;
}

export interface UserAnalyticsResult {
  enabled: boolean;
  reason?: string;
  overview: UserAnalyticsOverview;
  recentHistory: UserHistoryItem[];
  categoryBreakdown: AnalyticsChartDatum[];
  dailyEngagement: AnalyticsChartDatum[];
  popularContent: PopularContentItem[];
}
