CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE media_items (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_email TEXT,
  uploader_email TEXT NOT NULL REFERENCES users(email),
  submitted_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE media_tags (
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (media_id, tag)
);

CREATE INDEX media_items_status_idx ON media_items (approval_status, submitted_at DESC);
CREATE INDEX media_items_category_idx ON media_items (category, submitted_at DESC);
