"use client";

import { Clock3, Heart, MessageCircle } from "lucide-react";
import type { SnapItem } from "@/backend/snap/types";

interface SnapStripProps {
  items: SnapItem[];
  onOpen: (snapId: string) => void;
  selectedId?: string;
}

export function SnapStrip({ items, onOpen, selectedId }: SnapStripProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
      {items.map((item) => {
        const active = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item.id)}
            className={`min-w-[250px] snap-start rounded-[1.7rem] border p-3 text-left transition-all duration-300 sm:min-w-[280px] ${
              active ? "border-[#f0d6a8]/60 bg-[#111b2b]" : "border-white/10 bg-[linear-gradient(180deg,rgba(14,22,36,0.92),rgba(10,16,28,0.98))] hover:border-[#f0d6a8]/35"
            }`}
          >
            <div className="relative overflow-hidden rounded-[1.4rem]">
              <img src={item.imageUrl} alt={item.caption || item.userName} className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-medium text-white">
                <Clock3 className="h-3.5 w-3.5" />
                {item.expiresInLabel}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">{item.userName}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#b7c6da]">{item.caption || "No caption"}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#9fb0c7]">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className={`h-3.5 w-3.5 ${item.viewerHasLiked ? "fill-current text-rose-300" : ""}`} />
                  {item.likesCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {item.commentsCount}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
