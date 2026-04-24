# BITStream

A moderated campus video streaming platform for BITS Pilani, Goa. Students sign in with their college Google account, upload videos, and an admin reviews every submission before it goes public. Every view is tracked in a Postgres analytics layer, and a built-in chatbot recommends videos from the library.

I built BITStream for my **Database Management Systems (DBMS)** course, from January to April 2026.

**Author:** [Kanav Midha](https://github.com/Kanav-Midha)

---

## Features

- **Google sign-in** limited to `@goa.bits-pilani.ac.in` accounts (Auth.js)
- **Upload and moderation**: student uploads stay `pending` until an admin approves or rejects them
- **Discovery page** that only shows approved content
- **My Uploads** page so students can track the status of their submissions
- **Watch analytics**: views, watch time and unique viewers are logged per session into Supabase (Postgres)
- **Profile dashboard** with charts of your own watch history by category
- **Snaps**: short stories that expire, with likes and comments
- **AI concierge chatbot** that recommends videos only from what's in the library

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend | Next.js route handlers and server actions, Auth.js (Google OAuth) |
| Database | PostgreSQL on Supabase, plus a JSON store for local development |
| Media | Cloudinary for video and thumbnail uploads |
| AI | Vercel AI SDK with Google Gemini |

## Database design

The ER diagram is in [`database/BITStream ER Diagram.png`](database/BITStream%20ER%20Diagram.png), and table-by-table `DESC` output is in [`database/TABLE_DESC.md`](database/TABLE_DESC.md).

| Schema file | What it covers |
| --- | --- |
| [`database/schema.sql`](database/schema.sql) | Core tables: `users`, `media_items`, `media_tags`, with `CHECK` constraints, foreign keys and composite indexes |
| [`database/supabase/analytics-schema.sql`](database/supabase/analytics-schema.sql) | `user_profiles`, `media_watch_events`, and the `analytics_content_popularity` and `analytics_user_watch_summary` views |
| [`database/supabase/snap-schema.sql`](database/supabase/snap-schema.sql) | `snap_posts`, `snap_likes`, `snap_comments` |
| [`database/supabase/analytics-queries.sql`](database/supabase/analytics-queries.sql) | Reporting queries: top viewers, most popular content, watch time per category |

DBMS concepts used: normalisation (tags split into their own table), primary, unique and foreign keys, `ON DELETE CASCADE`, `CHECK` constraints for status enums, composite and descending indexes for the common query paths, and views for aggregate analytics (`COUNT DISTINCT`, `SUM`, `GROUP BY`).

## Project structure

```
app/         Next.js routes and API handlers (thin layer)
frontend/    UI modules and reusable components
backend/     auth, content, storage, analytics and snap logic
database/    SQL schemas, ER diagram, seed data
components/  shadcn/ui primitives
public/      static assets
```

More detail is in [`API.md`](API.md) and [`SCHEMA.md`](SCHEMA.md).

## Running it locally

```bash
git clone https://github.com/Kanav-Midha/BITStream.git
cd BITStream
npm install
cp .env.example .env.local   # then fill in your own keys
npm run dev
```

Then open http://localhost:3000.

**Environment variables**

- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google OAuth
- `ADMIN_EMAILS`: comma-separated list of admin accounts
- `CLOUDINARY_*`: optional. Without them, uploads fall back to hosted URLs.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: analytics and snaps. See [`database/supabase/SETUP.md`](database/supabase/SETUP.md)
- `GOOGLE_GENERATIVE_AI_API_KEY`: for the chatbot

In local development, content lives in `database/content-library.json`, and uploaded files are saved under `public/uploads/`.

---

Made by Kanav Midha · DBMS course project · Jan–Apr 2026
