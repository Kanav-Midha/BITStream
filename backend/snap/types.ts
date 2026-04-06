export interface SnapComment {
  id: string;
  comment: string;
  createdAt: string;
  userAvatar?: string | null;
  userEmail: string;
  userName: string;
}

export interface SnapItem {
  id: string;
  caption: string;
  comments: SnapComment[];
  commentsCount: number;
  createdAt: string;
  expiresAt: string;
  expiresInLabel: string;
  imageUrl: string;
  likesCount: number;
  userAvatar?: string | null;
  userEmail: string;
  userName: string;
  viewerHasLiked: boolean;
}

export interface SnapFeedResult {
  enabled: boolean;
  items: SnapItem[];
  reason?: string;
}

export interface CreateSnapInput {
  caption: string;
  imageUrl: string;
}
