import { createHash } from "node:crypto";
import type { AppSessionUser } from "@/backend/auth/session";
import { getSupabaseClient } from "@/backend/storage/supabase";
import type { CreateSnapInput, SnapComment, SnapFeedResult, SnapItem } from "@/backend/snap/types";

type SnapPostRow = {
  caption: string;
  created_at: string;
  expires_at: string;
  id: string;
  image_url: string;
  user_avatar: string | null;
  user_email: string;
  user_name: string;
};

type SnapLikeRow = {
  snap_id: string;
  user_email: string;
};

type SnapCommentRow = {
  comment: string;
  created_at: string;
  id: string;
  snap_id: string;
  user_avatar: string | null;
  user_email: string;
  user_name: string;
};

const EMPTY_FEED: SnapFeedResult = {
  enabled: false,
  items: [],
};
const SNAP_TAG = "bitstream-snap";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

type CloudinarySnapResource = {
  context?: {
    custom?: Record<string, string>;
  };
  created_at?: string;
  public_id: string;
  secure_url: string;
  tags?: string[];
};

function formatSnapSetupReason(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("snap_posts") ||
    normalized.includes("snap_likes") ||
    normalized.includes("snap_comments") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "Supabase is connected, but the Snap tables are missing. Run database/supabase/snap-schema.sql in the Supabase SQL editor, then redeploy.";
  }

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("etimedout")
  ) {
    return "Snap is temporarily unable to reach Supabase. Try again in a moment.";
  }

  return message;
}

function cloudinarySnapEnabled() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
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

function encodeContextValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/=/g, "\\=")
    .replace(/\n/g, "\\n");
}

function decodeContextValue(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\=/g, "=")
    .replace(/\\\|/g, "|")
    .replace(/\\\\/g, "\\");
}

function buildContextString(metadata: Record<string, string | undefined>) {
  return Object.entries(metadata)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${encodeContextValue(value!)}`)
    .join("|");
}

function createSnapRecordSvgDataUri(title: string) {
  const label = title.slice(0, 28).replace(/[<>&"]/g, "").trim() || "Campus Snap";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" rx="72" fill="#07111D"/><rect x="84" y="84" width="1032" height="1032" rx="52" fill="#101C2B"/><circle cx="280" cy="310" r="120" fill="#F0D6A8"/><rect x="480" y="250" width="460" height="92" rx="30" fill="#1B2A41"/><rect x="480" y="384" width="360" height="58" rx="24" fill="#152235"/><text x="140" y="700" fill="#F8E8CB" font-family="Arial, sans-serif" font-size="120" font-weight="700">BITStream</text><text x="140" y="828" fill="#D5E0EE" font-family="Arial, sans-serif" font-size="66">${label}</text><text x="140" y="916" fill="#96A9C0" font-family="Arial, sans-serif" font-size="42">Snap record</text></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function mapCloudinarySnapResource(resource: CloudinarySnapResource, viewerEmail?: string): SnapItem | null {
  const context = resource.context?.custom || {};
  const expiresAt = decodeContextValue(context.expires_at) || resource.created_at || new Date().toISOString();

  if (new Date(expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const imageUrl = decodeContextValue(context.image_url) || resource.secure_url;
  const likesCount = Number.parseInt(decodeContextValue(context.likes_count) || "0", 10) || 0;
  const commentsCount = Number.parseInt(decodeContextValue(context.comments_count) || "0", 10) || 0;
  const likedBy = decodeContextValue(context.liked_by)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return {
    caption: decodeContextValue(context.caption),
    comments: [],
    commentsCount,
    createdAt: decodeContextValue(context.created_at) || resource.created_at || new Date().toISOString(),
    expiresAt,
    expiresInLabel: formatExpiresInLabel(expiresAt),
    id: resource.public_id,
    imageUrl,
    likesCount,
    userAvatar: decodeContextValue(context.user_avatar) || null,
    userEmail: decodeContextValue(context.user_email) || "unknown@goa.bits-pilani.ac.in",
    userName: decodeContextValue(context.user_name) || "BITS Goa",
    viewerHasLiked: viewerEmail ? likedBy.includes(viewerEmail.toLowerCase()) : false,
  };
}

async function listCloudinarySnaps(viewerEmail?: string): Promise<SnapFeedResult | null> {
  if (!cloudinarySnapEnabled()) {
    return null;
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/tags/${SNAP_TAG}?context=true&max_results=200`,
    {
      headers: {
        Authorization: getCloudinaryBasicAuthHeader(),
      },
    },
  );

  const payload = (await response.json()) as { resources?: CloudinarySnapResource[]; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to fetch Cloudinary Snap records.");
  }

  return {
    enabled: true,
    items: (payload.resources || [])
      .map((resource) => mapCloudinarySnapResource(resource, viewerEmail))
      .filter((resource): resource is SnapItem => Boolean(resource))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
  };
}

async function createCloudinarySnap(user: AppSessionUser, input: CreateSnapInput) {
  if (!cloudinarySnapEnabled()) {
    throw new Error("Snap storage is not configured.");
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const publicId = `snap-${Date.now()}-${crypto.randomUUID()}`;
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const context = buildContextString({
    asset_role: "snap",
    caption: input.caption.trim().slice(0, 220),
    comments_count: "0",
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    image_url: input.imageUrl.trim(),
    likes_count: "0",
    liked_by: "",
    user_avatar: user.image || "",
    user_email: user.email,
    user_name: user.name,
  });
  const tags = SNAP_TAG;
  const signature = createCloudinarySignature({
    context,
    public_id: publicId,
    tags,
    timestamp,
  });

  const formData = new FormData();
  formData.append("file", createSnapRecordSvgDataUri(input.caption.trim()));
  formData.append("api_key", CLOUDINARY_API_KEY!);
  formData.append("timestamp", timestamp);
  formData.append("public_id", publicId);
  formData.append("context", context);
  formData.append("tags", tags);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as CloudinarySnapResource & { error?: { message?: string } };

  if (!response.ok || !payload.public_id) {
    throw new Error(payload.error?.message || "Unable to create Snap record.");
  }

  const snap = mapCloudinarySnapResource(payload, user.email);

  if (!snap) {
    throw new Error("Unable to create Snap record.");
  }

  return snap;
}

function formatExpiresInLabel(expiresAt: string) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.ceil(remainingMs / (1000 * 60));

  if (totalMinutes < 60) {
    return `${totalMinutes}m left`;
  }

  const totalHours = Math.ceil(totalMinutes / 60);

  if (totalHours < 24) {
    return `${totalHours}h left`;
  }

  return `${Math.ceil(totalHours / 24)}d left`;
}

function buildSnapComments(rows: SnapCommentRow[]) {
  return rows.map(
    (row): SnapComment => ({
      comment: row.comment,
      createdAt: row.created_at,
      id: row.id,
      userAvatar: row.user_avatar,
      userEmail: row.user_email,
      userName: row.user_name,
    }),
  );
}

function buildSnapItems(params: {
  comments: SnapCommentRow[];
  likes: SnapLikeRow[];
  posts: SnapPostRow[];
  viewerEmail?: string;
}) {
  const commentsBySnap = new Map<string, SnapCommentRow[]>();

  for (const comment of params.comments) {
    const current = commentsBySnap.get(comment.snap_id) || [];
    current.push(comment);
    commentsBySnap.set(comment.snap_id, current);
  }

  const likesBySnap = new Map<string, Set<string>>();

  for (const like of params.likes) {
    const current = likesBySnap.get(like.snap_id) || new Set<string>();
    current.add(like.user_email);
    likesBySnap.set(like.snap_id, current);
  }

  return params.posts.map(
    (post): SnapItem => ({
      caption: post.caption,
      comments: buildSnapComments(commentsBySnap.get(post.id) || []),
      commentsCount: (commentsBySnap.get(post.id) || []).length,
      createdAt: post.created_at,
      expiresAt: post.expires_at,
      expiresInLabel: formatExpiresInLabel(post.expires_at),
      id: post.id,
      imageUrl: post.image_url,
      likesCount: (likesBySnap.get(post.id) || new Set<string>()).size,
      userAvatar: post.user_avatar,
      userEmail: post.user_email,
      userName: post.user_name,
      viewerHasLiked: params.viewerEmail ? (likesBySnap.get(post.id) || new Set<string>()).has(params.viewerEmail) : false,
    }),
  );
}

async function getSnapInteractions(snapIds: string[]) {
  const supabase = getSupabaseClient();

  if (!supabase || snapIds.length === 0) {
    return {
      comments: [] as SnapCommentRow[],
      likes: [] as SnapLikeRow[],
    };
  }

  const [{ data: likes, error: likesError }, { data: comments, error: commentsError }] = await Promise.all([
    supabase.from("snap_likes").select("snap_id,user_email").in("snap_id", snapIds),
    supabase
      .from("snap_comments")
      .select("id,snap_id,user_email,user_name,user_avatar,comment,created_at")
      .in("snap_id", snapIds)
      .order("created_at", { ascending: true }),
  ]);

  if (likesError) {
    throw new Error(likesError.message);
  }

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  return {
    comments: (comments || []) as SnapCommentRow[],
    likes: (likes || []) as SnapLikeRow[],
  };
}

async function assertSnapIsActive(snapId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for Snap.");
  }

  const { data, error } = await supabase
    .from("snap_posts")
    .select("id")
    .eq("id", snapId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("This snap has expired or is unavailable.");
  }
}

export async function listActiveSnaps(viewerEmail?: string): Promise<SnapFeedResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    if (cloudinarySnapEnabled()) {
      try {
        return (await listCloudinarySnaps(viewerEmail)) || {
          enabled: true,
          items: [],
        };
      } catch (error) {
        return {
          ...EMPTY_FEED,
          reason: error instanceof Error ? formatSnapSetupReason(error.message) : "Snap is not ready yet.",
        };
      }
    }

    return {
      ...EMPTY_FEED,
      reason: "Add Supabase env vars to enable Snap stories.",
    };
  }

  try {
    const { data: posts, error } = await supabase
      .from("snap_posts")
      .select("id,user_email,user_name,user_avatar,image_url,caption,created_at,expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      throw new Error(error.message);
    }

    const normalizedPosts = (posts || []) as SnapPostRow[];

    if (normalizedPosts.length === 0) {
      return {
        enabled: true,
        items: [],
      };
    }

    const interactions = await getSnapInteractions(normalizedPosts.map((post) => post.id));

    return {
      enabled: true,
      items: buildSnapItems({
        comments: interactions.comments,
        likes: interactions.likes,
        posts: normalizedPosts,
        viewerEmail,
      }),
    };
  } catch (error) {
    if (cloudinarySnapEnabled()) {
      try {
        return (await listCloudinarySnaps(viewerEmail)) || {
          enabled: true,
          items: [],
        };
      } catch {
        // fall through to the original error handling below
      }
    }

    return {
      ...EMPTY_FEED,
      reason: error instanceof Error ? formatSnapSetupReason(error.message) : "Snap is not ready yet.",
    };
  }
}

export async function getSnapByIdForViewer(snapId: string, viewerEmail?: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("snap_posts")
    .select("id,user_email,user_name,user_avatar,image_url,caption,created_at,expires_at")
    .eq("id", snapId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const interactions = await getSnapInteractions([snapId]);

  return buildSnapItems({
    comments: interactions.comments,
    likes: interactions.likes,
    posts: [data as SnapPostRow],
    viewerEmail,
  })[0] || null;
}

export async function createSnap(user: AppSessionUser, input: CreateSnapInput) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    if (cloudinarySnapEnabled()) {
      return createCloudinarySnap(user, input);
    }

    throw new Error("Supabase is not configured for Snap.");
  }

  const caption = input.caption.trim().slice(0, 220);
  const imageUrl = input.imageUrl.trim();

  if (!imageUrl) {
    throw new Error("Upload an image or paste a hosted image URL.");
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  try {
    const { data, error } = await supabase
      .from("snap_posts")
      .insert({
        caption,
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        image_url: imageUrl,
        user_avatar: user.image || null,
        user_email: user.email,
        user_name: user.name,
      })
      .select("id,user_email,user_name,user_avatar,image_url,caption,created_at,expires_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return buildSnapItems({
      comments: [],
      likes: [],
      posts: [data as SnapPostRow],
      viewerEmail: user.email,
    })[0] || null;
  } catch (error) {
    if (cloudinarySnapEnabled()) {
      return createCloudinarySnap(user, input);
    }

    throw error;
  }
}

export async function toggleSnapLike(user: AppSessionUser, snapId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Likes are temporarily unavailable for Snap.");
  }

  await assertSnapIsActive(snapId);

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("snap_likes")
    .select("snap_id,user_email")
    .eq("snap_id", snapId)
    .eq("user_email", user.email)
    .maybeSingle();

  if (existingLikeError) {
    throw new Error(existingLikeError.message);
  }

  if (existingLike) {
    const { error } = await supabase.from("snap_likes").delete().eq("snap_id", snapId).eq("user_email", user.email);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("snap_likes").insert({
      snap_id: snapId,
      user_email: user.email,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return getSnapByIdForViewer(snapId, user.email);
}

export async function addSnapComment(user: AppSessionUser, snapId: string, comment: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Comments are temporarily unavailable for Snap.");
  }

  await assertSnapIsActive(snapId);

  const normalizedComment = comment.trim();

  if (!normalizedComment) {
    throw new Error("Write a comment before posting.");
  }

  const { error } = await supabase.from("snap_comments").insert({
    comment: normalizedComment.slice(0, 280),
    snap_id: snapId,
    user_avatar: user.image || null,
    user_email: user.email,
    user_name: user.name,
  });

  if (error) {
    throw new Error(error.message);
  }

  return getSnapByIdForViewer(snapId, user.email);
}
