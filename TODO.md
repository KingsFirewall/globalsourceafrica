# GlobalSource Africa — working list

Small batches, a few items a day. **You** = owner action. **Me** = Claude, from the repo.
Tick items off as they land. Newest decisions at the bottom of "Done".

---

## 🔴 Do first — live risk

- [ ] **You · Revoke the Google OAuth client secret.** Google Cloud Console → APIs &
      Services → Credentials → delete the `client_secret_1066799764690-…` client.
      It sat in a public repo; it is off `main` now but old commits stay reachable
      by hash, so only revoking closes it.
- [ ] **You · Revoke the 4 GitHub tokens** pasted into chat. GitHub → Settings →
      Developer settings → Personal access tokens. Each has full `repo` scope.
      Next time generate a fine-grained token limited to one repo.

## 📧 Stop losing leads — this week

- [ ] **You · Create a Resend account** (resend.com), verify `globalsourceafrica.com`,
      generate an API key. `hello@globalsourceafrica.com` is already verified. ✅
- [ ] **Me · Wire it up** — set `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` on
      Vercel and test end to end. Sending code already exists in `src/lib/v2/inquiries.ts`;
      it is a silent no-op until the key is present, so every inquiry currently
      vanishes with no alert to you and no acknowledgement to the buyer.
- [ ] **You · Submit a test request** on the live site and confirm both emails arrive.

## ☎️ Dead buttons on the live site

- [ ] **You · WhatsApp Business number**, full format `+234…`
- [ ] **You · LinkedIn company page URL**
- [ ] **You · Phone number** to display
- [ ] **Me · Patch them into** `contact/page.tsx` and `SiteFooter.tsx` — both currently
      point at an empty `wa.me/` and a bare `linkedin.com`, so they go nowhere.

## 🏢 Company identity

- [ ] **You · RC number** from the CAC certificate → footer + About entity line
- [ ] **You · Exact registered company name**, character for character
- [ ] **You · Registered office address** (Lagos) + whether to publish it
- [ ] **You · TIN** (FIRS)
- [ ] **You · Confirm founder name spelling** — site says "Isreal Kingsley". Is it
      Isreal or **Israel**? Appears on the home page and About.
- [ ] **You · Founder LinkedIn + 2–3 line bio** (years in trade, background)

## 📄 Sample verification report

- [ ] **Me · Draft a print-ready redacted sample report** as a page in the repo
- [ ] **You · Review it** — check the findings read like real work you'd deliver
- [ ] **Me · Export to `/public/sample-report.pdf`** and wire up the download
      Today the email gate captures the lead then serves a 404. Worst possible
      moment to look broken — they had just decided to trust you.

## ⚖️ Legal pages — both are placeholders right now

Live on the site labelled "LEGAL · PLACEHOLDER".

- [ ] **You · Governing law** (Nigeria?) and dispute resolution
- [ ] **You · Refund policy** — what if a buyer cancels mid-verification?
- [ ] **You · Liability cap** — get a lawyer on this one specifically. You issue risk
      ratings buyers act on; define your exposure if a cleared supplier defaults.
- [ ] **Me · Write both pages** once the above is decided

## 💰 Taking payment

Stripe does **not** operate in Nigeria — ignore earlier advice to use it.

- [ ] **You · Pick a processor** — Paystack or Flutterwave (both Nigerian, need CAC + TIN)
- [ ] **You · Domiciliary USD account** for wires from EU/US/Gulf buyers
- [ ] **You · Wise Business or Payoneer** as the foreign-currency receiving option
- [ ] **Me · Add payment / invoicing flow** once chosen

A buyer paying for scam protection is reassured by a card payment and a receipt,
and made nervous by a bank transfer to an unfamiliar account. The payment method
is part of the product.

## 🌍 Origins — make the claims checkable

- [ ] **You · Confirm or correct the regions** published per country. I used real
      export regions (Kano, Ashanti, Fayoum, Sidama, Mtwara) but was guessing at
      *your* footprint. The site now claims presence in each.
- [ ] **You · Named person per origin** — name, role, city. Deferred until people
      are fully on the ground.
- [ ] **Me · Update `src/lib/v2/origins.ts`** — one file, every page follows.

## 🔍 Inspection

- [ ] **You · Decide** whether to open an account with SGS / Cotecna / Bureau Veritas /
      Intertek. Not required to book them per job, but a standing account lets you
      say so on the site and usually improves turnaround and pricing.

## 🤖 Chat assistant

- [ ] **You · Add `ANTHROPIC_API_KEY`** on Vercel — the widget hides itself until then
- [ ] **Me · Verify it stops behaving like the old shop** (it still has product-catalog
      tools from the v1 marketplace)

## ✍️ Content / SEO — once the above is done

- [ ] One buyer guide per origin: Ethiopian coffee grading, Nigerian sesame specs,
      Tanzanian cashew seasons, Egyptian herb MRLs. Each proves ground knowledge
      and earns search traffic.

---

## Done

- [x] Untangled three repos → one: `KingsFirewall/globalsourceafrica`, branch `main`
- [x] Fixed `MIDDLEWARE_INVOCATION_FAILED` — a missing env var can no longer 500 the
      public site, only degrade `/admin`
- [x] Documented the setup in `DEPLOYMENT.md`
- [x] Expanded Ghana-only → five live origins (Nigeria, Ghana, Egypt, Ethiopia, Tanzania)
- [x] Corrected founder base to Lagos and registration to Nigeria
- [x] Removed the unsubstantiated "SGS-COORDINATED" badge — we now claim the
      capability (engaging accredited inspectors per job) rather than a partnership
      we do not have
