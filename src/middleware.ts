import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refreshes the Supabase auth session so the admin panel's server components
 * and server actions see the passwordless session reliably.
 *
 * Two constraints here are load-bearing, both learned from a production 500:
 *
 * 1. It runs ONLY on /admin. The public marketing site has no auth and reads no
 *    Supabase data server-side (public pages render from src/lib/v2/*, and the
 *    intake/lead server actions use the service-role client, not the session).
 *    Running this on every route meant one Supabase problem took the WHOLE site
 *    down — and billed edge compute on every static marketing page.
 *
 * 2. It never throws. Missing env (a fresh Vercel project with no vars set) or a
 *    Supabase outage degrades to "not signed in" — requireStaff() then redirects
 *    to /admin/login — instead of MIDDLEWARE_INVOCATION_FAILED on every request.
 *
 * /auth/callback is deliberately NOT matched: it builds its own client and sets
 * its own cookies, so middleware would be redundant there.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Supabase not configured — pass through untouched rather than crash.
  if (!url || !anonKey) return response;

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // Session refresh is best-effort. Every admin route re-verifies staff on the
    // server anyway, so failing here costs a redirect to login, never access.
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
