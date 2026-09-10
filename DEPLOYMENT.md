# Deployment — where this project actually lives

Written after a repo/hosting mix-up in Sept 2026 that took the site down.
If you are unsure where anything goes, this file is the answer.

## The one repo

| | |
|---|---|
| **Canonical repo** | https://github.com/KingsFirewall/globalsourceafrica |
| **Production branch** | `main` |
| **Host** | Vercel (KingsFirewall account) |
| **Domain** | globalsourceafrica.com + www |

`git push` goes here and nowhere else. Pushing to `main` deploys to production.

### Retired repos — do NOT push to these

- `Fvevr-Kings/Globalsourceafrica-` — the original developer's account, read-only to us.
- `whisperinga43-droid/globalsource_africa` — older account, carried the pre-v2 marketplace code.

Both once served this project, and having three remotes wired to one folder is what
caused the confusion. They are no longer configured locally. Leave them alone.

Note: the v1 marketplace history diverged from the v2 line on 2026-06-15 (`270d729`),
so those repos are *parallel timelines*, not older versions — never merge them into
`main`. Doing so drags back the dead cart/checkout/merchant code. The old v1 head is
kept locally as tag `v1-archive`.

## DNS (Namecheap, BasicDNS)

Nameservers must be `pdns1/pdns2.registrar-servers.com`. Under **Advanced DNS**,
exactly two records:

| Type | Host | Value |
|---|---|---|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | the per-project value shown in Vercel → Settings → Domains |

Only ONE `www` CNAME may exist. Two CNAMEs on the same host is invalid DNS and
resolvers pick unpredictably — this broke the domain once already. Delete any
Namecheap parking-page CNAME or URL-redirect record.

## Environment variables (set on the Vercel project)

Required — the admin panel needs all three:

    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY      # server-only; no NEXT_PUBLIC_ prefix, ever

Optional:

    ANTHROPIC_API_KEY              # chat assistant; widget hides itself when unset
    RESEND_API_KEY / NOTIFY_EMAIL / NOTIFY_FROM   # inquiry + auto-ack emails

Never set `ADMIN_DEV_BYPASS` on Vercel — it disables admin auth. It is hard-gated to
non-production builds, but it does not belong in that list.

Env vars belong to the Vercel *project*, not the repo: they survive changing the Git
source, and they do NOT follow you to a newly created project. They also do not apply
to builds that already ran — redeploy after adding them.

## Why the public site no longer depends on Supabase

`src/middleware.ts` runs only on `/admin` and never throws. Missing env or a Supabase
outage degrades to "signed out" instead of returning 500 on every page. Public pages
are static and read no Supabase data, so they stay up regardless.
