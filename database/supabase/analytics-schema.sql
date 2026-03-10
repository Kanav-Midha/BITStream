create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_email text primary key,
  display_name text not null,
  avatar_url text,
  role text not null check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.media_watch_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  user_email text not null references public.user_profiles(user_email) on delete cascade,
  media_id text,
  media_slug text not null,
  media_title text not null,
  media_category text,
  video_url text,
  event_type text not null check (event_type in ('opened', 'started', 'heartbeat', 'paused', 'completed')),
  watch_seconds integer not null default 0,
  progress_percent numeric(5,2),
  duration_seconds integer,
  current_time_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists media_watch_events_user_email_occurred_at_idx
  on public.media_watch_events (user_email, occurred_at desc);

create index if not exists media_watch_events_media_slug_occurred_at_idx
  on public.media_watch_events (media_slug, occurred_at desc);

create index if not exists media_watch_events_session_id_idx
  on public.media_watch_events (session_id);

create or replace view public.analytics_content_popularity as
select
  media_slug,
  max(media_title) as media_title,
  max(media_category) as media_category,
  count(distinct concat(user_email, ':', session_id)) as unique_viewers,
  coalesce(sum(watch_seconds), 0) as total_watch_seconds,
  max(occurred_at) as last_engaged_at
from public.media_watch_events
group by media_slug;

create or replace view public.analytics_user_watch_summary as
select
  user_email,
  count(distinct media_slug) as titles_watched,
  count(distinct session_id) as sessions_count,
  coalesce(sum(watch_seconds), 0) as total_watch_seconds,
  max(occurred_at) as last_active_at
from public.media_watch_events
group by user_email;
