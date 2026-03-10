# Supabase Analytics Setup

Run [analytics-schema.sql](./analytics-schema.sql) in the Supabase SQL editor first.

Then make sure Vercel has either:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

or the Vercel integration aliases already present in your project:

- `BITSTREAM_STORAGE_SUPABASE_URL`
- `BITSTREAM_STORAGE_SUPABASE_SERVICE_ROLE_KEY`
- `BITSTREAM_STORAGE_SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_BITSTREAM_STORAGE_SUPABASE_URL`

After that, redeploy the app and open `/profile`.
