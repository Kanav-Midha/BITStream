"use client";

import { Clock3, Heart, MessageCircle, X } from "lucide-react";
import type { SnapItem } from "@/backend/snap/types";
import { SnapComments } from "@/frontend/modules/snap/snap-comments";

interface SnapViewerProps {
  onClose: () => void;
  onComment: (snapId: string, comment: string) => Promise<void>;
  onLike: (snapId: string) => Promise<void>;
  snap: SnapItem;
}

function formatPostedTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function SnapViewer({ onClose, onComment, onLike, snap }: SnapViewerProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050a12]/82 px-4 py-6 backdrop-blur-md">
      <div className="relative grid max-h-[92vh] w-full max-w-6xl gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,26,0.98),rgba(18,28,44,0.96))] p-4 shadow-[0_28px_120px_rgba(0,0,0,0.5)] lg:grid-cols-[1.2fr_0.8fr] lg:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white transition-colors hover:border-[#f0d6a8]/40 hover:text-[#f0d6a8]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-black">
          <img src={snap.imageUrl} alt={snap.caption || snap.userName} className="h-full max-h-[78vh] w-full object-cover" />
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[#d8bc88]">Snap live</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{snap.userName}</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-[#d6e1f2]">
                <Clock3 className="h-3.5 w-3.5 text-[#f0d6a8]" />
                {snap.expiresInLabel}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#d5deea]">{snap.caption || "No caption"}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#9bb0ca]">
              <span>Posted {formatPostedTime(snap.createdAt)} IST</span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {snap.commentsCount} comments
              </span>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => onLike(snap.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  snap.viewerHasLiked
                    ? "bg-rose-400/20 text-rose-200 hover:bg-rose-400/25"
                    : "border border-white/10 bg-white/6 text-white hover:border-[#f0d6a8]/35 hover:text-[#f0d6a8]"
                }`}
              >
                <Heart className={`h-4 w-4 ${snap.viewerHasLiked ? "fill-current" : ""}`} />
                {snap.viewerHasLiked ? "Liked" : "Like"} · {snap.likesCount}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <SnapComments comments={snap.comments} onSubmit={(comment) => onComment(snap.id, comment)} />
          </div>
        </div>
      </div>
    </div>
  );
}
