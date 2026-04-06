"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Flame, RefreshCw, Sparkles, SquarePen } from "lucide-react";
import type { SnapFeedResult, SnapItem } from "@/backend/snap/types";
import { SnapComposer } from "@/frontend/modules/snap/snap-composer";
import { SnapStrip } from "@/frontend/modules/snap/snap-strip";
import { SnapViewer } from "@/frontend/modules/snap/snap-viewer";

interface SnapPageProps {
  directUploadEnabled: boolean;
  initialFeed: SnapFeedResult;
  viewerSignedIn: boolean;
}

type SnapTab = "live" | "post";

async function createSnapRequest(payload: { caption: string; imageUrl: string }) {
  const response = await fetch("/api/snap", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const result = (await response.json()) as { error?: string; snap?: SnapItem; success?: boolean };

  if (response.status === 401) {
    throw new Error("Your session expired. Sign in again, then retry posting.");
  }

  if (!response.ok || !result.success || !result.snap) {
    throw new Error(result.error || "Unable to create snap.");
  }

  return result.snap;
}

async function likeSnapRequest(snapId: string) {
  const response = await fetch("/api/snap/like", {
    body: JSON.stringify({ snapId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const result = (await response.json()) as { error?: string; snap?: SnapItem; success?: boolean };

  if (response.status === 401) {
    throw new Error("Your session expired. Sign in again to like snaps.");
  }

  if (!response.ok || !result.success || !result.snap) {
    throw new Error(result.error || "Unable to update like.");
  }

  return result.snap;
}

async function commentSnapRequest(snapId: string, comment: string) {
  const response = await fetch("/api/snap/comment", {
    body: JSON.stringify({ comment, snapId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const result = (await response.json()) as { error?: string; snap?: SnapItem; success?: boolean };

  if (response.status === 401) {
    throw new Error("Your session expired. Sign in again to comment.");
  }

  if (!response.ok || !result.success || !result.snap) {
    throw new Error(result.error || "Unable to add comment.");
  }

  return result.snap;
}

async function listSnapsRequest() {
  const response = await fetch("/api/snap", {
    method: "GET",
  });

  const result = (await response.json()) as SnapFeedResult & { error?: string };

  if (response.status === 401) {
    throw new Error("Sign in again to load the live Snap lane.");
  }

  if (!response.ok) {
    throw new Error(result.reason || result.error || "Unable to load live snaps.");
  }

  return result;
}

export function SnapPage({ directUploadEnabled, initialFeed, viewerSignedIn }: SnapPageProps) {
  const [feed, setFeed] = useState(initialFeed);
  const [activeTab, setActiveTab] = useState<SnapTab>("post");
  const [selectedSnapId, setSelectedSnapId] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedSnap = useMemo(
    () => feed.items.find((item) => item.id === selectedSnapId) || null,
    [feed.items, selectedSnapId],
  );

  useEffect(() => {
    if (!viewerSignedIn) {
      setRefreshError("");
      return;
    }

    let cancelled = false;

    async function loadInitialLive() {
      try {
        const nextFeed = await listSnapsRequest();

        if (!cancelled) {
          setFeed(nextFeed);
          setRefreshError("");
        }
      } catch (error) {
        if (!cancelled) {
          setRefreshError(error instanceof Error ? error.message : "Unable to load live snaps.");
        }
      }
    }

    void loadInitialLive();

    return () => {
      cancelled = true;
    };
  }, [viewerSignedIn]);

  function upsertSnap(nextSnap: SnapItem, options?: { prepend?: boolean }) {
    setFeed((current) => {
      const filtered = current.items.filter((item) => item.id !== nextSnap.id);
      return {
        ...current,
        enabled: true,
        items: options?.prepend ? [nextSnap, ...filtered] : [nextSnap, ...filtered],
      };
    });
    setRefreshError("");
    setSelectedSnapId(nextSnap.id);
  }

  async function handleCreateSnap(payload: { caption: string; imageUrl: string }) {
    const nextSnap = await createSnapRequest(payload);
    upsertSnap(nextSnap, { prepend: true });
    const nextFeed = await listSnapsRequest().catch(() => null);

    if (nextFeed) {
      setFeed(nextFeed);
    }

    setActiveTab("live");
  }

  async function handleLikeSnap(snapId: string) {
    const nextSnap = await likeSnapRequest(snapId);
    upsertSnap(nextSnap);
  }

  async function handleCommentSnap(snapId: string, comment: string) {
    const nextSnap = await commentSnapRequest(snapId, comment);
    upsertSnap(nextSnap);
  }

  async function handleRefreshLive() {
    try {
      setIsRefreshing(true);
      setRefreshError("");
      const nextFeed = await listSnapsRequest();
      setFeed(nextFeed);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to load live snaps.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <>
      <section className="relative border-b border-white/10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,20,34,0.95),rgba(18,32,52,0.92))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#f0d6a8]">
                  <Sparkles className="h-4 w-4" />
                  24-hour lane
                </div>
                <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">Snap</h1>
                <p className="mt-4 text-sm leading-7 text-[#c2d1e4] sm:text-base">
                  Fast image drops for Goa BITS. Post a moment, keep it live for 24 hours, and let the campus react in real time.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#d8bc88]">Window</p>
                    <p className="mt-3 text-sm font-semibold text-white">24 hours</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#d8bc88]">Live now</p>
                    <p className="mt-3 text-2xl font-bold text-white">{feed.items.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/4 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-[#f0d6a8]" />
                  <h2 className="text-lg font-semibold text-white">How Snap works</h2>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-7 text-[#afc0d6]">
                  <p>1. Upload an image or paste a hosted image URL.</p>
                  <p>2. Add a short caption and post it to the lane.</p>
                  <p>3. The snap stays visible to all signed-in BITS users for 24 hours.</p>
                  <p>4. Others can like it and comment while it is live.</p>
                </div>
              </div>
            </aside>

            <div className="space-y-8">
              <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,18,30,0.96),rgba(17,27,43,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-6">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Snap space</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        {activeTab === "post" ? "Post a new snap" : "Live campus snaps"}
                      </h2>
                    </div>
                    <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("post")}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === "post" ? "bg-[#f0d6a8] text-[#111827]" : "text-[#c0cede] hover:text-white"
                        }`}
                      >
                        <SquarePen className="h-4 w-4" />
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("live")}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === "live" ? "bg-[#f0d6a8] text-[#111827]" : "text-[#c0cede] hover:text-white"
                        }`}
                      >
                        <Flame className="h-4 w-4" />
                        Live
                      </button>
                    </div>
                  </div>

                  {activeTab === "post" ? (
                    <SnapComposer canPost={viewerSignedIn} directUploadEnabled={directUploadEnabled} onCreate={handleCreateSnap} />
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm leading-6 text-[#9bb0ca]">
                          See everything that is still live across campus for the next 24 hours.
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#c0cede]">
                            <Flame className="h-4 w-4 text-[#f0d6a8]" />
                            {feed.items.length} active
                          </div>
                          <button
                            type="button"
                            onClick={handleRefreshLive}
                            disabled={!viewerSignedIn || isRefreshing}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#f0d6a8]/35 hover:text-[#f0d6a8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                          </button>
                        </div>
                      </div>

                      {!viewerSignedIn && (
                        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-[#d5e1ee]">
                          Sign in from the top-right corner to view live campus snaps.
                        </div>
                      )}

                      {viewerSignedIn && !feed.enabled && feed.reason && (
                        <div className="rounded-[1.5rem] border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-50">
                          <p className="font-semibold">Snap is not fully active yet.</p>
                          <p className="mt-2 text-amber-100/90">{feed.reason}</p>
                          <p className="mt-2 text-amber-100/75">
                            Required file: <code className="rounded bg-black/20 px-2 py-1 text-xs">database/supabase/snap-schema.sql</code>
                          </p>
                        </div>
                      )}

                      {refreshError && (
                        <div className="rounded-[1.5rem] border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
                          {refreshError}
                        </div>
                      )}

                      {viewerSignedIn && feed.items.length > 0 ? (
                        <SnapStrip items={feed.items} onOpen={setSelectedSnapId} selectedId={selectedSnap?.id} />
                      ) : viewerSignedIn ? (
                        <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-black/10 px-4 py-16 text-center text-sm text-[#9bb0ca]">
                          No active snaps yet. Post one first, then open the Live tab to see it here.
                        </div>
                      ) : null}
                    </div>
                  )}
              </section>
            </div>
          </div>
        </div>
      </section>
      {selectedSnap && (
        <SnapViewer onClose={() => setSelectedSnapId("")} onComment={handleCommentSnap} onLike={handleLikeSnap} snap={selectedSnap} />
      )}
    </>
  );
}
