import type { AppSessionUser } from "@/backend/auth/session";

export const PUBLIC_CATEGORY = "Public" as const;

export const CONTENT_CATEGORIES = [
  "Movies",
  "Series",
  "Campus Stories",
  "Vlogs",
  "Educational",
  "Comedy",
  "Music",
  "Tutorials",
  PUBLIC_CATEGORY,
] as const;

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface MediaItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  durationLabel: string;
  videoUrl: string;
  thumbnailUrl: string;
  submittedAt: string;
  updatedAt: string;
  uploader: Pick<AppSessionUser, "email" | "name" | "role" | "image">;
  approval: {
    status: ApprovalStatus;
    notes?: string;
    reviewedAt?: string;
    reviewedByEmail?: string;
  };
  stats: {
    views: number;
    likes: number;
  };
}

export interface ContentLibrary {
  media: MediaItem[];
}

export interface MediaFilters {
  category?: string;
  query?: string;
  status?: ApprovalStatus;
  uploaderEmail?: string;
}

export interface CreateSubmissionInput {
  title: string;
  description: string;
  category: ContentCategory;
  tags: string[];
  durationLabel: string;
  videoUrl: string;
  thumbnailUrl: string;
  uploader: AppSessionUser;
  storage?: {
    videoPublicId?: string;
    thumbnailPublicId?: string;
  };
}
