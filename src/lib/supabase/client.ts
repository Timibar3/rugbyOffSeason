import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Cliente para uso en Client Components ("use client").
// Crea una nueva instancia por llamada pero el SDK la reutiliza internamente.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
