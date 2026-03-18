"use client";

import { useEffect, useMemo, useRef } from "react";
import type { WatchEventType } from "@/backend/analytics/types";
import { parseDurationLabelToSeconds } from "@/backend/analytics/utils";

interface TrackedVideoPlayerProps {
  category: string;
  description?: string;
  embedUrl?: string | null;
  poster: string;
  title: string;
  videoId?: string;
  videoSlug: string;
  videoUrl: string;
  durationLabel: string;
}

function postTrackingEvent(
  payload: Record<string, string | number | boolean | null | Record<string, string | number | boolean | null>>,
) {
  void fetch("/api/track", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}

export function TrackedVideoPlayer({
  category,
  description,
  embedUrl,
  poster,
  title,
  videoId,
  videoSlug,
  videoUrl,
  durationLabel,
}: TrackedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const lastTrackedTimeRef = useRef(0);
  const fallbackDuration = parseDurationLabelToSeconds(durationLabel);

  function sendEvent(eventType: WatchEventType, params?: Partial<Record<string, number | null>>) {
    postTrackingEvent({
      currentTimeSeconds: params?.currentTimeSeconds ?? null,
      durationSeconds: params?.durationSeconds ?? fallbackDuration ?? null,
      eventType,
      mediaCategory: category,
      mediaId: videoId || null,
      mediaSlug: videoSlug,
      mediaTitle: title,
      metadata: {
        hasEmbed: Boolean(embedUrl),
        summary: description || "",
      },
      progressPercent: params?.progressPercent ?? null,
      sessionId,
      videoUrl,
      watchSeconds: params?.watchSeconds ?? 0,
    });
  }

  useEffect(() => {
    sendEvent("opened", { durationSeconds: fallbackDuration });
  }, [fallbackDuration]);

  useEffect(() => {
    if (!embedUrl) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      sendEvent("heartbeat", {
        durationSeconds: fallbackDuration,
        watchSeconds: 15,
      });
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [embedUrl, fallbackDuration]);

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster}
      className="aspect-video w-full bg-black object-cover"
      onLoadedMetadata={(event) => {
        const currentDuration = Number.isFinite(event.currentTarget.duration)
          ? Math.round(event.currentTarget.duration)
          : fallbackDuration;
        sendEvent("opened", { durationSeconds: currentDuration });
      }}
      onPlay={(event) => {
        const currentTime = Math.round(event.currentTarget.currentTime);
        lastTrackedTimeRef.current = currentTime;
        sendEvent("started", {
          currentTimeSeconds: currentTime,
          durationSeconds: Math.round(event.currentTarget.duration || fallbackDuration),
          progressPercent:
            event.currentTarget.duration > 0 ? (event.currentTarget.currentTime / event.currentTarget.duration) * 100 : 0,
        });
      }}
      onPause={(event) => {
        const currentTime = Math.round(event.currentTarget.currentTime);
        const watchedSeconds = Math.max(0, currentTime - lastTrackedTimeRef.current);
        lastTrackedTimeRef.current = currentTime;
        sendEvent("paused", {
          currentTimeSeconds: currentTime,
          durationSeconds: Math.round(event.currentTarget.duration || fallbackDuration),
          progressPercent:
            event.currentTarget.duration > 0 ? (event.currentTarget.currentTime / event.currentTarget.duration) * 100 : 0,
          watchSeconds: watchedSeconds,
        });
      }}
      onTimeUpdate={(event) => {
        const currentTime = Math.round(event.currentTarget.currentTime);

        if (currentTime - lastTrackedTimeRef.current < 15) {
          return;
        }

        const watchedSeconds = Math.max(0, currentTime - lastTrackedTimeRef.current);
        lastTrackedTimeRef.current = currentTime;
        sendEvent("heartbeat", {
          currentTimeSeconds: currentTime,
          durationSeconds: Math.round(event.currentTarget.duration || fallbackDuration),
          progressPercent:
            event.currentTarget.duration > 0 ? (event.currentTarget.currentTime / event.currentTarget.duration) * 100 : 0,
          watchSeconds: watchedSeconds,
        });
      }}
      onEnded={(event) => {
        const currentTime = Math.round(event.currentTarget.currentTime);
        const watchedSeconds = Math.max(0, currentTime - lastTrackedTimeRef.current);
        lastTrackedTimeRef.current = currentTime;
        sendEvent("completed", {
          currentTimeSeconds: currentTime,
          durationSeconds: Math.round(event.currentTarget.duration || fallbackDuration),
          progressPercent: 100,
          watchSeconds: watchedSeconds,
        });
      }}
    >
      <source src={videoUrl} />
    </video>
  );
}
