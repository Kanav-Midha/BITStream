import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BITSTREAM_STORAGE_SUPABASE_URL?.trim() ||
    ""
  );
}

function getSupabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.BITSTREAM_STORAGE_SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

export function analyticsEnabled() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function getAnalyticsAdminClient(): SupabaseClient | null {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
