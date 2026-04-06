create extension if not exists pgcrypto;

create table if not exists public.snap_posts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text not null,
  user_avatar text,
  image_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists snap_posts_created_at_idx
  on public.snap_posts (created_at desc);

create index if not exists snap_posts_expires_at_idx
  on public.snap_posts (expires_at desc);

create table if not exists public.snap_likes (
  id bigint generated always as identity primary key,
  snap_id uuid not null references public.snap_posts(id) on delete cascade,
  user_email text not null,
  created_at timestamptz not null default now(),
  unique (snap_id, user_email)
);

create index if not exists snap_likes_snap_id_idx
  on public.snap_likes (snap_id);

create table if not exists public.snap_comments (
  id uuid primary key default gen_random_uuid(),
  snap_id uuid not null references public.snap_posts(id) on delete cascade,
  user_email text not null,
  user_name text not null,
  user_avatar text,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists snap_comments_snap_id_created_at_idx
  on public.snap_comments (snap_id, created_at asc);
