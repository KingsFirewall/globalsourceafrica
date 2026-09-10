"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, ChevronRight, Leaf } from "lucide-react";

type ProductCard = {
  name: string;
  slug: string;
  price_usd: number | null;
  base_unit: string | null;
  origin_country: string | null;
  in_stock: boolean;
  image: string | null;
  url: string;
};

type Msg = { role: "user" | "assistant"; content: string; products?: ProductCard[] };

function ProductCards({ products }: { products: ProductCard[] }) {
  return (
    <div className="mt-2 space-y-2">
      {products.map((p) => (
        <a
          key={p.slug || p.name}
          href={p.url}
          className="flex items-center gap-3 rounded-xl border border-greenLine bg-white p-2 transition hover:border-green hover:shadow-sm"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-greenSoft">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <Leaf className="h-5 w-5 text-green" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
            <p className="truncate text-xs text-sub">
              {p.price_usd != null ? `$${p.price_usd}` : ""}
              {p.base_unit ? ` · ${p.base_unit}` : ""}
              {p.origin_country ? ` · ${p.origin_country}` : ""}
            </p>
            {!p.in_stock && <p className="text-xs text-goldDark">Out of stock</p>}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-green" />
        </a>
      ))}
    </div>
  );
}

const GREETING =
  "Hi! I'm the GlobalSource Africa assistant. I can explain our verification, sourcing and inspection services, walk you through how it works, or start a request. I can also look things up on the web. How can I help?";

// Minimal renderer: turns [label](url) and bare /paths or https links into
// anchors, preserves line breaks. Avoids pulling in a markdown dependency.
function renderContent(raw: string) {
  // Safety net: strip any stray markdown the model emits (the panel shows raw
  // characters, so **bold**, # headings and * bullets would look broken).
  const text = raw
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .trim();
  const parts: React.ReactNode[] = [];
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s]+|\/product\/[^\s]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2] ?? m[3];
    parts.push(
      <a
        key={key++}
        href={href}
        className="font-medium text-container underline underline-offset-2 hover:text-goldDark"
      >
        {label ?? href}
      </a>
    );
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const STORAGE_KEY = "gsa_chat_v1";
const CHAT_TTL_MS = 60 * 60 * 1000; // resume within 1h of last activity, else fresh

export function ChatWidget() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);

  // Restore an in-progress conversation (within TTL) so the user can pick up
  // where they left off after navigating to a product page and back. Reads
  // localStorage only after mount (SSR-safe).
  //
  // We intentionally do NOT auto-reopen the panel here. On mobile the panel is
  // fullscreen (fixed inset-0), so re-opening it on a fresh page load would
  // cover the product page the user just navigated to from a product link —
  // making it look like the link "redirected back to the chatbot". The
  // conversation is still restored, so reopening the launcher shows it intact.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          saved &&
          Array.isArray(saved.messages) &&
          saved.messages.length > 0 &&
          typeof saved.updatedAt === "number" &&
          Date.now() - saved.updatedAt < CHAT_TTL_MS
        ) {
          setMessages(saved.messages);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
    hydratedRef.current = true;
  }, []);

  // Desktop uses Lenis smooth scroll, which listens for wheel events on the
  // window and preventDefault()s them, so a wheel over the open panel scrolled
  // the page instead of the message list. `data-lenis-prevent` makes Lenis skip
  // any wheel whose composed path crosses the panel, handing the event back to
  // the browser: inside the message list that scrolls the list natively (and
  // `overscroll-contain` stops it chaining to the body at the ends). Over the
  // header/input there is nothing scrollable, so the browser would fall through
  // to the page again — swallow those here. Must be a native non-passive
  // listener; React routes onWheel through a passive root listener where
  // preventDefault is a no-op.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onWheel = (e: WheelEvent) => {
      const list = scrollRef.current;
      if (list && e.target instanceof Node && list.contains(e.target)) return;
      e.preventDefault();
    };
    panel.addEventListener("wheel", onWheel, { passive: false });
    return () => panel.removeEventListener("wheel", onWheel);
  }, [open]);

  // While the fullscreen mobile panel is open, lock background page scrolling so
  // touch-scrolling the message list can't chain to the body and drag the whole
  // panel (and its input bar) around. Desktop keeps its corner widget, so we
  // only lock below the sm breakpoint.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 640px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 100dvh doesn't shrink for the on-screen keyboard (keyboards aren't part of
  // the CSS viewport spec), so the fullscreen mobile panel keeps its full
  // height and the input bar at its bottom ends up hidden behind the keyboard.
  // Track the actual visible area via visualViewport and size the panel to
  // that instead, so the input always sits right above the keyboard.
  const [mobileViewport, setMobileViewport] = useState<{ top: number; height: number } | null>(
    null
  );
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv || window.matchMedia("(min-width: 640px)").matches) return;

    function update() {
      setMobileViewport({ top: vv!.offsetTop, height: vv!.height });
    }
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setMobileViewport(null);
    };
  }, [open]);

  // Persist on every change (after hydration), refreshing the TTL timestamp.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: messages.slice(-50), open, updatedAt: Date.now() })
      );
    } catch {}
  }, [messages, open]);

  // Only render once the server confirms the assistant is configured.
  useEffect(() => {
    let active = true;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => active && setEnabled(Boolean(d?.enabled)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, products: data.products },
      ]);
    } catch (e: any) {
      setError(e?.message ?? "The assistant is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        className={`fixed bottom-5 right-5 z-40 h-14 w-14 items-center justify-center rounded-full bg-container text-white shadow-lg transition hover:bg-brand focus:outline-none focus:ring-2 focus:ring-container/40 ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          data-lenis-prevent
          style={
            mobileViewport ? { top: mobileViewport.top, height: mobileViewport.height } : undefined
          }
          className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[32rem] sm:max-h-[calc(100vh-7rem)] sm:w-[22rem] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-2xl sm:border sm:border-greenLine"
        >
          <div className="flex shrink-0 items-center gap-2 bg-green px-4 py-3 text-white">
            <MessageCircle className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-display text-sm font-semibold">GlobalSource Assistant</p>
              <p className="text-xs text-white/80">Verification · Sourcing · Inspection</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-cream px-3 py-4"
          >
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-container text-white"
                        : "border border-greenLine bg-white text-ink"
                    }`}
                  >
                    {m.role === "assistant" ? renderContent(m.content) : m.content}
                  </div>
                </div>
                {m.role === "assistant" && m.products && m.products.length > 0 && (
                  <ProductCards products={m.products} />
                )}
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-greenLine bg-white px-3 py-2 text-sm text-sub">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-gold/15 px-3 py-2 text-xs text-goldDark">{error}</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex shrink-0 items-center gap-2 border-t border-greenLine bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product…"
              // text-base (16px) prevents iOS Safari from auto-zooming on focus.
              className="flex-1 rounded-full border border-greenLine px-4 py-2 text-base text-ink focus:border-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-container text-white hover:bg-brand disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
