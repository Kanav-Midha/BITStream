import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  decodeMetadataValue,
  encodeMetadataValue,
  formatDurationLabelFromSeconds,
} from "@/backend/content/utils";
import { getPreferredThumbnailUrl } from "@/backend/content/thumbnail-utils";
import type { ApprovalStatus, ContentCategory, MediaItem } from "@/backend/content/types";

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();
const BITSTREAM_TAG = "bitstream-media";
const RECORD_PUBLIC_ID_PREFIX = "record-";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video";
  duration?: number;
  tags?: string[];
  context?: {
    custom?: Record<string, string>;
  };
  created_at?: string;
}

interface UploadedAsset {
  publicId?: string;
  url: string;
}

interface SignedCloudinaryUpload {
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  resourceType: "video" | "image";
  signature: string;
  tags: string;
  timestamp: string;
}

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase() || ".bin";
  return `${Date.now()}-${crypto.randomUUID()}${extension.replace(/[^a-z0-9.]/g, "")}`;
}

function assertWithinSizeLimit(file: File, folderName: "videos" | "thumbnails") {
  const maxBytes = folderName === "videos" ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxBytes) {
    throw new Error(
      folderName === "videos"
        ? "Video file is too large. Keep it under 100MB or use a hosted URL."
        : "Thumbnail image is too large. Keep it under 6MB or use a hosted URL.",
    );
  }
}

async function persistFile(file: File, folderName: "videos" | "thumbnails") {
  if (!file || file.size === 0) {
    return { url: "" };
  }

  assertWithinSizeLimit(file, folderName);

  const safeFileName = sanitizeFileName(file.name);
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", folderName);
  const absolutePath = path.join(uploadDirectory, safeFileName);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/${folderName}/${safeFileName}` };
}

function createCloudinarySignature(params: Record<string, string>) {
  const payload = Object.entries(params)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

function getCloudinaryBasicAuthHeader() {
  return `Basic ${Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64")}`;
}

export function cloudinaryUploadsEnabled() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

export function cloudinaryMetadataEnabled() {
  return cloudinaryUploadsEnabled() && process.env.VERCEL === "1";
}

function buildContextString(metadata: Record<string, string | undefined>) {
  return Object.entries(metadata)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${encodeMetadataValue(value!)}`)
    .join("|");
}

export function createSignedCloudinaryUpload(params: {
  folderName: "videos" | "thumbnails";
  resourceType: "video" | "image";
}) {
  if (!cloudinaryUploadsEnabled()) {
    throw new Error("Cloudinary upload is not configured.");
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const folder = `bitstream/${params.folderName}`;
  const publicId = `${params.folderName}-${Date.now()}-${crypto.randomUUID()}`;
  const tags = BITSTREAM_TAG;
  const signature = createCloudinarySignature({
    folder,
    public_id: publicId,
    tags,
    timestamp,
  });

  return {
    apiKey: CLOUDINARY_API_KEY!,
    cloudName: CLOUDINARY_CLOUD_NAME!,
    folder,
    publicId,
    resourceType: params.resourceType,
    signature,
    tags,
    timestamp,
  } satisfies SignedCloudinaryUpload;
}

async function uploadToCloudinary(
  file: File,
  folderName: "videos" | "thumbnails",
  resourceType: "video" | "image",
) {
  if (!cloudinaryUploadsEnabled()) {
    return persistFile(file, folderName);
  }

  assertWithinSizeLimit(file, folderName);
  const signedUpload = createSignedCloudinaryUpload({ folderName, resourceType });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signedUpload.apiKey);
  formData.append("timestamp", signedUpload.timestamp);
  formData.append("folder", signedUpload.folder);
  formData.append("public_id", signedUpload.publicId);
  formData.append("signature", signedUpload.signature);
  formData.append("tags", signedUpload.tags);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json()) as CloudinaryUploadResult & { error?: { message?: string } };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloud upload failed.");
  }

  return {
    publicId: payload.public_id,
    url: payload.secure_url,
  };
}

async function updateCloudinaryVideoMetadata(params: {
  publicId: string;
  resourceType: "video" | "image";
  assetRole: "media" | "record";
  approvalStatus: ApprovalStatus;
  category: ContentCategory;
  title: string;
  description: string;
  durationLabel: string;
  thumbnailUrl: string;
  externalVideoUrl?: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderRole: string;
  slug: string;
  tags: string[];
  notes?: string;
  reviewedAt?: string;
  reviewedByEmail?: string;
}) {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const context = buildContextString({
    asset_role: params.assetRole,
    approval_status: params.approvalStatus,
    category: params.category,
    title: params.title,
    description: params.description,
    duration_label: params.durationLabel,
    thumbnail_url: params.thumbnailUrl,
    external_video_url: params.externalVideoUrl,
    uploader_email: params.uploaderEmail,
    uploader_name: params.uploaderName,
    uploader_role: params.uploaderRole,
    slug: params.slug,
    updated_at: new Date().toISOString(),
    review_notes: params.notes,
    reviewed_at: params.reviewedAt,
    reviewed_by_email: params.reviewedByEmail,
  });
  const tags = [BITSTREAM_TAG, ...params.tags].join(",");
  const signature = createCloudinarySignature({
    context,
    public_id: params.publicId,
    tags,
    timestamp,
    type: "upload",
  });

  const formData = new FormData();
  formData.append("api_key", CLOUDINARY_API_KEY!);
  formData.append("timestamp", timestamp);
  formData.append("public_id", params.publicId);
  formData.append("type", "upload");
  formData.append("context", context);
  formData.append("tags", tags);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${params.resourceType}/explicit`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json()) as CloudinaryUploadResult & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to update Cloudinary metadata.");
  }

  return payload;
}

function createRecordSvgDataUri(title: string) {
  const label = title.slice(0, 24).replace(/[<>&"]/g, "").trim() || "BITStream";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" rx="48" fill="#07111D"/><rect x="44" y="44" width="1112" height="587" rx="34" fill="#101C2B"/><rect x="88" y="104" width="338" height="338" rx="52" fill="#F0D6A8"/><path d="M184 184H330C354.301 184 374 203.699 374 228V246C374 270.301 354.301 290 330 290H184V184Z" fill="#081220"/><path d="M184 306H350C371.539 306 389 323.461 389 345C389 366.539 371.539 384 350 384H184V306Z" fill="#081220"/><text x="480" y="260" fill="#F8E8CB" font-family="Arial, sans-serif" font-size="84" font-weight="700">BITStream</text><text x="480" y="346" fill="#D5E0EE" font-family="Arial, sans-serif" font-size="38">${label}</text><text x="480" y="412" fill="#96A9C0" font-family="Arial, sans-serif" font-size="28">External hosted video</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function createCloudinaryRecordAsset(params: {
  title: string;
  slug: string;
  category: ContentCategory;
  description: string;
  durationLabel: string;
  thumbnailUrl: string;
  externalVideoUrl: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderRole: string;
  tags: string[];
}) {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const folder = "bitstream/records";
  const publicId = `${RECORD_PUBLIC_ID_PREFIX}${Date.now()}-${crypto.randomUUID()}`;
  const context = buildContextString({
    asset_role: "record",
    approval_status: "pending",
    category: params.category,
    title: params.title,
    description: params.description,
    duration_label: params.durationLabel,
    thumbnail_url: params.thumbnailUrl,
    external_video_url: params.externalVideoUrl,
    uploader_email: params.uploaderEmail,
    uploader_name: params.uploaderName,
    uploader_role: params.uploaderRole,
    slug: params.slug,
    updated_at: new Date().toISOString(),
  });
  const tags = [BITSTREAM_TAG, ...params.tags].join(",");
  const signature = createCloudinarySignature({
    context,
    folder,
    public_id: publicId,
    tags,
    timestamp,
  });

  const formData = new FormData();
  formData.append("file", createRecordSvgDataUri(params.title));
  formData.append("api_key", CLOUDINARY_API_KEY!);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("context", context);
  formData.append("tags", tags);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as CloudinaryUploadResult & { error?: { message?: string } };

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message || "Unable to save external video record.");
  }

  return payload;
}

async function fetchCloudinaryResources(resourceType: "video" | "image") {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/${resourceType}/tags/${BITSTREAM_TAG}?context=true&max_results=500`,
    {
      headers: {
        Authorization: getCloudinaryBasicAuthHeader(),
      },
    },
  );

  const payload = (await response.json()) as { resources?: CloudinaryUploadResult[]; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to fetch Cloudinary resources.");
  }

  return payload.resources || [];
}

async function fetchCloudinaryResource(publicId: string, resourceType: "video" | "image") {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}?with_field=context&with_field=tags`,
    {
      headers: {
        Authorization: getCloudinaryBasicAuthHeader(),
      },
    },
  );

  const payload = (await response.json()) as CloudinaryUploadResult & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to fetch Cloudinary resource.");
  }

  return payload;
}

async function fetchCloudinaryResourceAny(publicId: string) {
  try {
    return await fetchCloudinaryResource(publicId, "video");
  } catch {
    return fetchCloudinaryResource(publicId, "image");
  }
}

function mapCloudinaryResourceToMedia(resource: CloudinaryUploadResult): MediaItem {
  const context = resource.context?.custom || {};
  const approvalStatus = (decodeMetadataValue(context.approval_status) || "pending") as ApprovalStatus;
  const assetRole = decodeMetadataValue(context.asset_role);
  const tags = (resource.tags || []).filter((tag) => tag !== BITSTREAM_TAG);
  const thumbnailUrl = decodeMetadataValue(context.thumbnail_url);
  const durationLabel =
    decodeMetadataValue(context.duration_label) || formatDurationLabelFromSeconds(resource.duration);
  const externalVideoUrl = decodeMetadataValue(context.external_video_url);

  return {
    id: resource.public_id,
    slug: decodeMetadataValue(context.slug) || resource.public_id,
    title: decodeMetadataValue(context.title) || "Untitled upload",
    description: decodeMetadataValue(context.description) || "",
    category: (decodeMetadataValue(context.category) || "Campus Stories") as ContentCategory,
    tags,
    durationLabel,
    videoUrl: externalVideoUrl || resource.secure_url,
    thumbnailUrl: getPreferredThumbnailUrl({
      thumbnailUrl: assetRole === "record" ? thumbnailUrl || resource.secure_url : thumbnailUrl,
      videoUrl: externalVideoUrl || resource.secure_url,
    }),
    submittedAt: resource.created_at || new Date().toISOString(),
    updatedAt: decodeMetadataValue(context.updated_at) || resource.created_at || new Date().toISOString(),
    uploader: {
      email: decodeMetadataValue(context.uploader_email) || "unknown@goa.bits-pilani.ac.in",
      name: decodeMetadataValue(context.uploader_name) || "Student",
      role: decodeMetadataValue(context.uploader_role) === "admin" ? "admin" : "student",
      image: null,
    },
    approval: {
      status: approvalStatus,
      notes: decodeMetadataValue(context.review_notes) || undefined,
      reviewedAt: decodeMetadataValue(context.reviewed_at) || undefined,
      reviewedByEmail: decodeMetadataValue(context.reviewed_by_email) || undefined,
    },
    stats: {
      views: 0,
      likes: 0,
    },
  };
}

export async function persistVideoUpload(file: File): Promise<UploadedAsset> {
  return uploadToCloudinary(file, "videos", "video");
}

export async function persistThumbnailUpload(file: File): Promise<UploadedAsset> {
  return uploadToCloudinary(file, "thumbnails", "image");
}

export async function createCloudinarySubmissionRecord(params: {
  publicId?: string;
  slug: string;
  title: string;
  description: string;
  category: ContentCategory;
  durationLabel: string;
  thumbnailUrl: string;
  externalVideoUrl?: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderRole: string;
  tags: string[];
}) {
  if (!params.publicId) {
    if (!params.externalVideoUrl) {
      throw new Error("Missing uploaded video or hosted video URL.");
    }

    const resource = await createCloudinaryRecordAsset({
      category: params.category,
      description: params.description,
      durationLabel: params.durationLabel,
      externalVideoUrl: params.externalVideoUrl,
      slug: params.slug,
      tags: params.tags,
      thumbnailUrl: params.thumbnailUrl,
      title: params.title,
      uploaderEmail: params.uploaderEmail,
      uploaderName: params.uploaderName,
      uploaderRole: params.uploaderRole,
    });

    return mapCloudinaryResourceToMedia(resource);
  }

  const resource = await updateCloudinaryVideoMetadata({
    publicId: params.publicId,
    resourceType: "video",
    assetRole: "media",
    approvalStatus: "pending",
    category: params.category,
    description: params.description,
    durationLabel: params.durationLabel,
    externalVideoUrl: params.externalVideoUrl,
    slug: params.slug,
    tags: params.tags,
    thumbnailUrl: params.thumbnailUrl,
    title: params.title,
    uploaderEmail: params.uploaderEmail,
    uploaderName: params.uploaderName,
    uploaderRole: params.uploaderRole,
  });

  return mapCloudinaryResourceToMedia(resource);
}

export async function updateCloudinarySubmissionReview(params: {
  publicId: string;
  approvalStatus: Extract<ApprovalStatus, "approved" | "rejected">;
  notes?: string;
  reviewedByEmail: string;
}) {
  const existing = await fetchCloudinaryResourceAny(params.publicId);
  const current = mapCloudinaryResourceToMedia(existing);
  const updated = await updateCloudinaryVideoMetadata({
    publicId: params.publicId,
    resourceType: existing.resource_type,
    assetRole:
      decodeMetadataValue(existing.context?.custom?.asset_role) === "record" ? "record" : "media",
    approvalStatus: params.approvalStatus,
    category: current.category,
    description: current.description,
    durationLabel: current.durationLabel,
    externalVideoUrl: decodeMetadataValue(existing.context?.custom?.external_video_url) || undefined,
    slug: current.slug,
    tags: current.tags,
    thumbnailUrl: current.thumbnailUrl,
    title: current.title,
    uploaderEmail: current.uploader.email,
    uploaderName: current.uploader.name,
    uploaderRole: current.uploader.role,
    notes: params.notes?.trim() || undefined,
    reviewedAt: new Date().toISOString(),
    reviewedByEmail: params.reviewedByEmail.toLowerCase(),
  });

  return mapCloudinaryResourceToMedia(updated);
}

export async function listCloudinaryMedia() {
  const [videoResources, imageResources] = await Promise.all([
    fetchCloudinaryResources("video"),
    fetchCloudinaryResources("image"),
  ]);

  return [...videoResources, ...imageResources]
    .filter((resource) => {
      const assetRole = decodeMetadataValue(resource.context?.custom?.asset_role);
      return assetRole === "media" || assetRole === "record";
    })
    .map(mapCloudinaryResourceToMedia);
}
