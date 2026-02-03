import path from "node:path";
import { readJsonFile, writeJsonFile } from "@/backend/storage/json-store";
import {
  cloudinaryMetadataEnabled,
  createCloudinarySubmissionRecord,
  listCloudinaryMedia,
  updateCloudinarySubmissionReview,
} from "@/backend/storage/file-uploads";
import type {
  ApprovalStatus,
  ContentLibrary,
  CreateSubmissionInput,
  MediaFilters,
  MediaItem,
} from "@/backend/content/types";
import { slugify } from "@/backend/content/utils";

const CONTENT_FILE = path.join(process.cwd(), "database", "content-library.json");

async function readLibrary() {
  return readJsonFile<ContentLibrary>(CONTENT_FILE, { media: [] });
}

async function writeLibrary(library: ContentLibrary) {
  await writeJsonFile(CONTENT_FILE, library);
}

function matchesFilters(media: MediaItem, filters: MediaFilters) {
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const normalizedCategory = filters.category?.trim();

  if (filters.status && media.approval.status !== filters.status) {
    return false;
  }

  if (filters.uploaderEmail && media.uploader.email !== filters.uploaderEmail.toLowerCase()) {
    return false;
  }

  if (normalizedCategory && normalizedCategory !== "All" && media.category !== normalizedCategory) {
    return false;
  }

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [media.title, media.description, media.category, media.tags.join(" ")]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

async function getLibraryItems() {
  if (cloudinaryMetadataEnabled()) {
    return listCloudinaryMedia();
  }

  const library = await readLibrary();
  return library.media;
}

export async function getMedia(filters: MediaFilters = {}) {
  const items = await getLibraryItems();

  return items
    .filter((media) => matchesFilters(media, filters))
    .sort((first, second) => {
      return new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime();
    });
}

export async function getApprovedMedia(filters: Omit<MediaFilters, "status"> = {}) {
  return getMedia({ ...filters, status: "approved" });
}

export async function getMediaBySlug(slug: string) {
  const items = await getLibraryItems();
  return items.find((media) => media.slug === slug || media.id === slug) || null;
}

export async function getLibraryCounts() {
  const items = await getMedia();

  return {
    approved: items.filter((item) => item.approval.status === "approved").length,
    pending: items.filter((item) => item.approval.status === "pending").length,
    rejected: items.filter((item) => item.approval.status === "rejected").length,
  };
}

export async function createSubmission(input: CreateSubmissionInput) {
  if (cloudinaryMetadataEnabled()) {
    const slugBase = slugify(input.title) || "campus-story";
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    return createCloudinarySubmissionRecord({
      category: input.category,
      description: input.description,
      durationLabel: input.durationLabel,
      externalVideoUrl: input.videoUrl,
      publicId: input.storage?.videoPublicId,
      slug,
      tags: input.tags,
      thumbnailUrl: input.thumbnailUrl,
      title: input.title,
      uploaderEmail: input.uploader.email,
      uploaderName: input.uploader.name,
      uploaderRole: input.uploader.role,
    });
  }

  const library = await readLibrary();
  const timestamp = new Date().toISOString();
  const baseSlug = slugify(input.title);
  const slugAlreadyUsed = new Set(library.media.map((item) => item.slug));
  let slug = baseSlug || `submission-${library.media.length + 1}`;
  let suffix = 1;

  while (slugAlreadyUsed.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const newMedia: MediaItem = {
    id: crypto.randomUUID(),
    slug,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags,
    durationLabel: input.durationLabel,
    videoUrl: input.videoUrl,
    thumbnailUrl: input.thumbnailUrl,
    submittedAt: timestamp,
    updatedAt: timestamp,
    uploader: input.uploader,
    approval: {
      status: "pending",
    },
    stats: {
      views: 0,
      likes: 0,
    },
  };

  library.media.unshift(newMedia);
  await writeLibrary(library);

  return newMedia;
}

export async function reviewSubmission(params: {
  id: string;
  status: Extract<ApprovalStatus, "approved" | "rejected">;
  reviewerEmail: string;
  notes?: string;
}) {
  if (cloudinaryMetadataEnabled()) {
    return updateCloudinarySubmissionReview({
      approvalStatus: params.status,
      notes: params.notes,
      publicId: params.id,
      reviewedByEmail: params.reviewerEmail,
    });
  }

  const library = await readLibrary();
  const item = library.media.find((media) => media.id === params.id);

  if (!item) {
    throw new Error("Submission not found.");
  }

  item.approval = {
    status: params.status,
    notes: params.notes?.trim() || undefined,
    reviewedAt: new Date().toISOString(),
    reviewedByEmail: params.reviewerEmail.toLowerCase(),
  };
  item.updatedAt = new Date().toISOString();

  await writeLibrary(library);

  return item;
}
