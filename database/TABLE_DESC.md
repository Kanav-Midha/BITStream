# BITStream Table Structure (DESC-Style Reference)

This file presents the current table definitions in a DESC-style format based on:

- `/database/schema.sql`
- `/database/supabase/analytics-schema.sql`
- `/database/supabase/snap-schema.sql`

It is intended to act like a schema screenshot/reference sheet for presentation and documentation.

---

## 1. `users`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `UUID` | `NO` | `PK` |  |  |
| `email` | `TEXT` | `NO` | `UK` |  |  |
| `name` | `TEXT` | `NO` |  |  |  |
| `image_url` | `TEXT` | `YES` |  |  |  |
| `role` | `TEXT` | `NO` |  |  | `CHECK role IN ('student','admin')` |
| `created_at` | `TIMESTAMPTZ` | `NO` |  | `NOW()` |  |

---

## 2. `media_items`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `UUID` | `NO` | `PK` |  |  |
| `slug` | `TEXT` | `NO` | `UK` |  |  |
| `title` | `TEXT` | `NO` |  |  |  |
| `description` | `TEXT` | `NO` |  |  |  |
| `category` | `TEXT` | `NO` |  |  |  |
| `duration_label` | `TEXT` | `NO` |  |  |  |
| `video_url` | `TEXT` | `NO` |  |  |  |
| `thumbnail_url` | `TEXT` | `NO` |  |  |  |
| `approval_status` | `TEXT` | `NO` |  |  | `CHECK approval_status IN ('pending','approved','rejected')` |
| `review_notes` | `TEXT` | `YES` |  |  |  |
| `reviewed_at` | `TIMESTAMPTZ` | `YES` |  |  |  |
| `reviewed_by_email` | `TEXT` | `YES` |  |  |  |
| `uploader_email` | `TEXT` | `NO` | `FK` |  | `REFERENCES users(email)` |
| `submitted_at` | `TIMESTAMPTZ` | `NO` |  |  |  |
| `updated_at` | `TIMESTAMPTZ` | `NO` |  |  |  |

### Indexes

- `media_items_status_idx (approval_status, submitted_at DESC)`
- `media_items_category_idx (category, submitted_at DESC)`

---

## 3. `media_tags`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `media_id` | `UUID` | `NO` | `PK, FK` |  | `REFERENCES media_items(id) ON DELETE CASCADE` |
| `tag` | `TEXT` | `NO` | `PK` |  |  |

---

## 4. `public.user_profiles`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `user_email` | `TEXT` | `NO` | `PK` |  |  |
| `display_name` | `TEXT` | `NO` |  |  |  |
| `avatar_url` | `TEXT` | `YES` |  |  |  |
| `role` | `TEXT` | `NO` |  |  | `CHECK role IN ('student','admin')` |
| `created_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |
| `updated_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |
| `last_seen_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |

---

## 5. `public.media_watch_events`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | `NO` | `PK` | `generated always as identity` |  |
| `session_id` | `UUID` | `NO` |  |  |  |
| `user_email` | `TEXT` | `NO` | `FK` |  | `REFERENCES public.user_profiles(user_email) ON DELETE CASCADE` |
| `media_id` | `TEXT` | `YES` |  |  |  |
| `media_slug` | `TEXT` | `NO` |  |  |  |
| `media_title` | `TEXT` | `NO` |  |  |  |
| `media_category` | `TEXT` | `YES` |  |  |  |
| `video_url` | `TEXT` | `YES` |  |  |  |
| `event_type` | `TEXT` | `NO` |  |  | `CHECK event_type IN ('opened','started','heartbeat','paused','completed')` |
| `watch_seconds` | `INTEGER` | `NO` |  | `0` |  |
| `progress_percent` | `NUMERIC(5,2)` | `YES` |  |  |  |
| `duration_seconds` | `INTEGER` | `YES` |  |  |  |
| `current_time_seconds` | `INTEGER` | `YES` |  |  |  |
| `metadata` | `JSONB` | `NO` |  | `'{}'::jsonb` |  |
| `occurred_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |

### Indexes

- `media_watch_events_user_email_occurred_at_idx (user_email, occurred_at DESC)`
- `media_watch_events_media_slug_occurred_at_idx (media_slug, occurred_at DESC)`
- `media_watch_events_session_id_idx (session_id)`

---

## 6. `public.snap_posts`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `UUID` | `NO` | `PK` | `gen_random_uuid()` |  |
| `user_email` | `TEXT` | `NO` |  |  |  |
| `user_name` | `TEXT` | `NO` |  |  |  |
| `user_avatar` | `TEXT` | `YES` |  |  |  |
| `image_url` | `TEXT` | `NO` |  |  |  |
| `caption` | `TEXT` | `NO` |  | `''` |  |
| `created_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |
| `expires_at` | `TIMESTAMPTZ` | `NO` |  |  |  |

### Indexes

- `snap_posts_created_at_idx (created_at DESC)`
- `snap_posts_expires_at_idx (expires_at DESC)`

---

## 7. `public.snap_likes`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT` | `NO` | `PK` | `generated always as identity` |  |
| `snap_id` | `UUID` | `NO` | `FK` |  | `REFERENCES public.snap_posts(id) ON DELETE CASCADE` |
| `user_email` | `TEXT` | `NO` | `UK (with snap_id)` |  |  |
| `created_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |

### Constraints / Indexes

- `UNIQUE (snap_id, user_email)`
- `snap_likes_snap_id_idx (snap_id)`

---

## 8. `public.snap_comments`

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| `id` | `UUID` | `NO` | `PK` | `gen_random_uuid()` |  |
| `snap_id` | `UUID` | `NO` | `FK` |  | `REFERENCES public.snap_posts(id) ON DELETE CASCADE` |
| `user_email` | `TEXT` | `NO` |  |  |  |
| `user_name` | `TEXT` | `NO` |  |  |  |
| `user_avatar` | `TEXT` | `YES` |  |  |  |
| `comment` | `TEXT` | `NO` |  |  |  |
| `created_at` | `TIMESTAMPTZ` | `NO` |  | `now()` |  |

### Indexes

- `snap_comments_snap_id_created_at_idx (snap_id, created_at ASC)`

---

## Views

### `public.analytics_content_popularity`

Derived from `public.media_watch_events`.

| Field | Type / Meaning |
| --- | --- |
| `media_slug` | grouped media identifier |
| `media_title` | aggregated title |
| `media_category` | aggregated category |
| `unique_viewers` | count of distinct `user_email:session_id` |
| `total_watch_seconds` | total watch duration |
| `last_engaged_at` | latest interaction timestamp |

### `public.analytics_user_watch_summary`

Derived from `public.media_watch_events`.

| Field | Type / Meaning |
| --- | --- |
| `user_email` | grouped tracked user |
| `titles_watched` | distinct watched titles |
| `sessions_count` | distinct watch sessions |
| `total_watch_seconds` | total watch time |
| `last_active_at` | latest interaction timestamp |

---

## Quick Relational Summary

- `users.email -> media_items.uploader_email`
- `media_items.id -> media_tags.media_id`
- `user_profiles.user_email -> media_watch_events.user_email`
- `snap_posts.id -> snap_likes.snap_id`
- `snap_posts.id -> snap_comments.snap_id`

## Notes for Presentation

- The **core application schema** models users, uploaded media, moderation status, and tags.
- The **analytics schema** tracks watch events and derives engagement views.
- The **Snap schema** models 24-hour image posts, likes, and comments.
- Some app-level links are stored as text fields rather than strict foreign keys, especially where data is merged from app content and Supabase analytics.
