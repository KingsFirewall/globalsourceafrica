import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER ONLY. Bypasses RLS. Used exclusively by order
 * placement to resolve authoritative tier pricing and write orders/buyers.
 * Never import this into a client component.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Next 14 stores fetch() GETs in its data cache, even on force-dynamic
      // pages — the admin panel kept showing stale rows (a new inquiry didn't
      // appear) because Supabase reads were served from .next/cache. Live data
      // only, always.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    }
  );
}
