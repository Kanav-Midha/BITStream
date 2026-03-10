import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BITSTREAM_STORAGE_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
