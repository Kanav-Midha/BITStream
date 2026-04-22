# Data Schema

## Users

- `email`
- `name`
- `image_url`
- `role`

## Media Items

- `title`
- `slug`
- `description`
- `category`
- `duration_label`
- `video_url`
- `thumbnail_url`
- `approval_status`
- `review_notes`
- `reviewed_at`
- `reviewed_by_email`
- `uploader_email`
- `submitted_at`
- `updated_at`

## Media Tags

- one-to-many tag list for each upload

## Workflow

1. Student signs in with Google using an approved BITS Goa domain account.
2. Student submits a media item.
3. Submission is stored with `approval_status = pending`.
4. Admin approves or rejects.
5. Only `approved` items show up on the public discovery pages.
