import Link from "next/link";
import type { MediaItem } from "@/backend/content/types";
import { formatCompactNumber } from "@/backend/content/utils";
import { MediaThumbnail } from "@/frontend/components/media-thumbnail";

interface MediaCardProps {
  media: MediaItem;
}

export function MediaCard({ media }: MediaCardProps) {
  return (
    <Link
      href={`/video/${media.slug}`}
      className="group relative flex h-[290px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,28,44,0.94),rgba(10,17,29,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-[#f0d6a8]/50 sm:h-[308px] sm:rounded-[1.75rem]"
    >
      <div className="relative aspect-video overflow-hidden border-b border-white/8">
        <MediaThumbnail
          src={media.thumbnailUrl}
          videoUrl={media.videoUrl}
          alt={media.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-semibold text-white">
          {media.category}
        </div>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
          {media.durationLabel}
        </div>
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="text-sm">▶</span>
          Play now
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex min-h-[76px] flex-col sm:min-h-[84px]">
          <h3 className="line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-[#f0d6a8] sm:text-xl">
            {media.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#b8c6da] sm:leading-6">{media.description}</p>
        </div>

        <div className="mt-3 flex min-h-[34px] max-h-[34px] flex-wrap content-start gap-2 overflow-hidden text-xs text-[#c6d3e3]">
          {media.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-white/8 bg-background/60 px-2.5 py-1">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-xs text-[#99abc3] sm:text-sm">
          <span className="truncate">{media.uploader.name}</span>
          <span className="shrink-0">
            {formatCompactNumber(media.stats.views)} views · {formatCompactNumber(media.stats.likes)} likes
          </span>
        </div>
      </div>
    </Link>
  );
}
