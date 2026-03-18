"use client";

import { useEffect, useRef } from "react";

export function VideoTracker({ slug, children }: { slug: string; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const videoElement = containerRef.current?.querySelector("video");
    if (!videoElement) return;

    let interval: NodeJS.Timeout;

    const startTracking = () => {
      // Send a ping every 10 seconds while the video is playing
      interval = setInterval(() => {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaSlug: slug, durationSeconds: 10 }),
        });
      }, 10000); 
    };

    const stopTracking = () => clearInterval(interval);

    videoElement.addEventListener("play", startTracking);
    videoElement.addEventListener("pause", stopTracking);
    videoElement.addEventListener("ended", stopTracking);

    return () => {
      stopTracking();
      videoElement.removeEventListener("play", startTracking);
      videoElement.removeEventListener("pause", stopTracking);
      videoElement.removeEventListener("ended", stopTracking);
    };
  }, [slug]);

  return <div ref={containerRef}>{children}</div>;
}
