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

- [x] **Resend account created**, sending subdomain `mail.globalsourceafrica.com`
      verified (DKIM + SPF green), API key generated. 2026-09-12.
- [x] **Me · Code wired** — `src/lib/v2/email.ts` sends branded HTML for inquiries and
      the sample-report gate, with reply-to pointing at the other party.
- [ ] **You · Add the env vars on Vercel** — `RESEND_API_KEY`, `NOTIFY_EMAIL`,
      `NOTIFY_FROM`, then redeploy. Until then every inquiry still vanishes silently.
      NOTIFY_FROM must be an address on `mail.globalsourceafrica.com` — the root
      domain is not verified in Resend and sending from it will be rejected.
- [ ] **You · Submit a test request** on the live site and confirm both emails arrive.

## ☎️ Dead buttons on the live site

- [ ] **You · WhatsApp Business number**, full format `+234…`
- [ ] **⏰ REMINDER · LinkedIn company page URL** — page not created yet (as of
      2026-09-12). Owner asked to be reminded. Footer + contact still link to a bare
      `linkedin.com` until then.
- [ ] **You · Phone number** to display
- [ ] **Me · Patch them into** `contact/page.tsx` and `SiteFooter.tsx` — both currently
      point at an empty `wa.me/` and a bare `linkedin.com`, so they go nowhere.

## 🏢 Company identity

- [x] **RC number** — 9851214, now published in the footer and on About
- [x] **Registered company name** — Global Source Africa Limited (note: the legal name
      is three words, the brand is one. Entity line carries the legal name; the brand
      stays GlobalSource Africa everywhere else. That is correct, not an inconsistency.)
- [x] **Founder name** — corrected to **Kingsley Israel**. The site had both the
      spelling and the name order wrong ("Isreal Kingsley").
- [ ] **Deferred · Registered office address** — skipped until there is a real one.
      A trust business with no address is a gap a careful buyer notices, so worth
      revisiting once premises are settled.
- [ ] **Not for the site · TIN** — owner's decision: goes on invoices and documents
      only, not published.
- [ ] **You · Founder bio** — 2–3 lines: years in trade, background, what he did before.

## 📄 Sample verification report

- [x] **Me · Draft a print-ready redacted sample report** — live at `/sample-report/print`
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

- [ ] **You · Reach out to SGS** (and/or Cotecna, Bureau Veritas, Intertek) to open an
      account. Decided 2026-09-10: the SGS-COORDINATED badge stays on the home page and
      you will establish the relationship. Until that is in place the badge is running
      ahead of the facts — worth closing sooner rather than later, since it is the one
      claim on the site a buyer could check independently.

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
- [x] Reframed the SGS/Cotecna copy: named as the accreditation tier we engage per
      job, never as partners, and the chat assistant is barred from claiming a
      partnership. Owner opted to keep the SGS-COORDINATED badge on the home page
      and to open an account with them — tracked under Inspection above.
- [x] Drafted the full sample verification report at `/sample-report/print`
