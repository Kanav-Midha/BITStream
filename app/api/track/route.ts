import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { recordWatchEvent } from "@/backend/analytics/service";
import type { TrackWatchEventInput, WatchEventType } from "@/backend/analytics/types";

const EVENT_TYPES = new Set<WatchEventType>(["opened", "started", "heartbeat", "paused", "completed"]);

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<TrackWatchEventInput> | null;

  if (!body?.mediaSlug || !body.mediaTitle || !body.sessionId || !body.eventType || !EVENT_TYPES.has(body.eventType)) {
    return NextResponse.json({ error: "Invalid tracking payload." }, { status: 400 });
  }

  try {
    const result = await recordWatchEvent(user, {
      currentTimeSeconds: normalizeNumber(body.currentTimeSeconds),
      durationSeconds: normalizeNumber(body.durationSeconds),
      eventType: body.eventType,
      mediaCategory: body.mediaCategory,
      mediaId: body.mediaId,
      mediaSlug: body.mediaSlug,
      mediaTitle: body.mediaTitle,
      metadata: body.metadata,
      progressPercent: normalizeNumber(body.progressPercent),
      sessionId: body.sessionId,
      videoUrl: body.videoUrl,
      watchSeconds: normalizeNumber(body.watchSeconds) || 0,
    });

    return NextResponse.json({ success: true, ...result }, { status: result.enabled ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track watch event.";
    const normalized = message.toLowerCase();

    if (
      normalized.includes("fetch failed") ||
      normalized.includes("network") ||
      normalized.includes("econnrefused") ||
      normalized.includes("enotfound") ||
      normalized.includes("etimedout")
    ) {
      return NextResponse.json(
        {
          enabled: false,
          success: false,
        },
        { status: 202 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
