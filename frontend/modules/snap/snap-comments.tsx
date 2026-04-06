"use client";

import { LoaderCircle, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import type { SnapComment } from "@/backend/snap/types";

interface SnapCommentsProps {
  comments: SnapComment[];
  onSubmit: (comment: string) => Promise<void>;
}

function formatCommentTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function SnapComments({ comments, onSubmit }: SnapCommentsProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);
      await onSubmit(comment);
      setComment("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-[#f0d6a8]" />
        <h3 className="text-sm font-semibold text-white">Comments</h3>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {comments.length > 0 ? (
          comments.map((item) => (
            <div key={item.id} className="rounded-[1.2rem] border border-white/8 bg-white/6 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.userName}</p>
                <p className="text-[11px] text-[#8fa3bd]">{formatCommentTime(item.createdAt)} IST</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#c5d1e1]">{item.comment}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/5 px-3 py-8 text-center text-sm text-[#9fb0c7]">
            First reply gets the lane moving.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Leave a quick reaction..."
          className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
        />
        {error && <p className="text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d6a8] px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f7dfb7] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Add comment
        </button>
      </form>
    </div>
  );
}
