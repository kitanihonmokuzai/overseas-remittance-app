import { createBrowserClient } from "@supabase/ssr";

function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  return value;
}

function supabaseKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
  }
  return value;
}

export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseKey());
}
