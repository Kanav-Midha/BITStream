# API Overview

BITStream currently uses Next.js server actions plus Auth.js rather than a separate REST server. The runtime logic is split into:

- `frontend/` for route-facing UI modules and components
- `backend/` for auth, moderation, storage, and content logic
- `database/` for the file-backed seed store and SQL schema reference

## Auth

- `app/api/auth/[...nextauth]/route.ts`
  Handles Google OAuth via Auth.js.
- Allowed sign-ins are restricted to `@goa.bits-pilani.ac.in`.
- Admin access comes from the `ADMIN_EMAILS` env var.

## Submission flow

- `submitMediaAction`
  Validates the form, saves local files when provided, creates a pending media entry, and revalidates the public/admin pages.
- `reviewSubmissionAction`
  Admin-only action that approves or rejects a submission and republishes the updated views.

## Storage

- Source of truth during local development: `database/content-library.json`
- Uploaded files:
  - `public/uploads/videos`
  - `public/uploads/thumbnails`

## Production note

This structure is ready to swap to a real database and object storage service later. The included `database/schema.sql` is the reference shape for that migration.
