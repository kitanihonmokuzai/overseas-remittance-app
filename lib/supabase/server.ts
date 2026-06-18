import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseConfigIssue() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "Vercelの環境変数 NEXT_PUBLIC_SUPABASE_URL が未設定です。";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return "Vercelの環境変数 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です。";
  }

  return null;
}

function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  return value.replace(/\/rest\/v1\/?$/, "");
}

function supabaseKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
  }
  return value;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; Server Actions can.
        }
      }
    }
  });
}
