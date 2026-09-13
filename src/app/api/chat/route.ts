import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { tools as customTools, runTool } from "@/lib/chatbot/tools";
import { getKnowledgeText } from "@/lib/chatbot/knowledge";
import { SERVICES } from "@/lib/v2/services";

// The assistant runs server-side only — the API key never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to Anthropic's most capable model; override with ANTHROPIC_MODEL
// (e.g. "claude-haiku-4-5") if you want a cheaper/faster chat.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_TOOL_ROUNDS = 6;

type ClientMsg = { role: "user" | "assistant"; content: string };

// Grounds the assistant in the real site so it answers from fact, not guesses.
// The admin-editable knowledge base (Supabase) is appended when present.
async function buildSystemPrompt(): Promise<string> {
  const services = SERVICES.map(
    (s) =>
      `- ${s.name} (${s.priceLabel}, ${s.timeline}): ${s.tagline} Deliverable: ${s.deliverable}`
  ).join("\n");

  const base = `You are the GlobalSource Africa assistant — a helpful, honest guide on the company's website.

ABOUT GLOBALSOURCE AFRICA
GlobalSource Africa is a supplier verification and sourcing service for international buyers who want to buy from African suppliers safely — before sending any money. The team is on the ground in five origins: Nigeria, Ghana, Egypt, Ethiopia and Tanzania. Typical products by origin — Nigeria: sesame, hibiscus, cocoa, ginger. Ghana: cocoa, shea, cashew. Egypt: dried herbs, spices, citrus, dates. Ethiopia: green coffee, sesame, pulses. Tanzania: raw cashew, coffee, cloves, pulses. It is run by real, named people in-country. GSA never holds inventory or takes title — buyers purchase directly from the verified supplier; GSA manages and protects the transaction.

THE FOUR SERVICES (flat, published fees)
${services}

HOW IT WORKS
1. Submit a request (product, quantity, destination, specs — or name a supplier to check).
2. GSA scopes the work and confirms a flat fee upfront.
3. Ground work: registry checks, license verification, physical or video site visit, reference calls.
4. Inspection coordinated at sampling and loading — GSA engages an independent, internationally accredited inspection firm (the SGS / Cotecna / Bureau Veritas tier) per shipment and passes their fee through at cost. GSA is not a partner or agent of any of those firms; never claim a partnership with them.
5. You receive a decision-ready report, or a verified supplier you can transact with.

Typical response time is within 48 hours. Contact: info@globalsourceafrica.com; WhatsApp and LinkedIn are available from the site footer.

HOW TO HELP
- Answer questions about the services, pricing, process, timelines, and origins using the facts above.
- When a visitor wants to start — verify a supplier, find suppliers, or source a product — collect their name, a contact (email OR phone), and what they need, then use the submit_quote_request tool (request_type "sourcing" for anything not a specific listed product). Confirm the details with them before submitting.
- Use the web_search tool when the answer depends on information not on this site or that changes over time — current export regulations, commodity prices, a specific company's public record, shipping/logistics news, or anything the visitor asks you to look up. Cite what you found in plain language.
- If a product catalog tool returns results, you may share them; if it returns nothing, offer to open a sourcing request instead.

STYLE — read carefully, this matters
- Talk like a helpful human on live chat, not a brochure or a document. Keep it SHORT: 1-3 sentences for most answers. Lead with the direct answer, then stop.
- Only use bullet points when you're genuinely listing several things (e.g. the four services). When you do, use simple dashes ("- "), one short line each — no more than 5.
- Plain text only. NO markdown formatting: no **bold**, no # headings, no tables, no numbered markdown. The chat window shows raw characters, so asterisks and hashes look broken.
- Don't dump everything you know. Answer only what was asked; offer one short follow-up if useful ("Want me to start a request?").
- Never invent prices, timelines, guarantees, or facts about GSA beyond what's above. If you don't know, say so briefly and point them to the team.
- You represent a trust service — be straight and warm, never salesy or padded.`;

  const knowledge = (await getKnowledgeText().catch(() => "")).trim();
  return knowledge
    ? `${base}\n\nADDITIONAL KNOWLEDGE (maintained by the GSA team — treat as authoritative):\n${knowledge}`
    : base;
}

export async function GET() {
  // The widget only mounts when the assistant is actually configured.
  return NextResponse.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet." },
      { status: 503 }
    );
  }

  let body: { messages?: ClientMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  // Normalise to Anthropic message params: text-only, alternating starts with
  // user (drop the client-side greeting and any leading assistant turns), cap
  // history so a long session can't blow the request up.
  const convo: Anthropic.MessageParam[] = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (convo.length && convo[0].role === "assistant") convo.shift();

  if (!convo.length) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const client = new Anthropic();
  const system = await buildSystemPrompt();
  const tools = [
    ...customTools,
    // Server-side web browsing (Anthropic-hosted, dynamic filtering on 4.8).
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
  ] as Anthropic.ToolUnion[];

  let products: unknown[] | undefined;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 800,
        output_config: { effort: "low" },
        system,
        tools,
        messages: convo,
      });

      // Server tool (web_search) hit its internal loop cap — resume it.
      if (res.stop_reason === "pause_turn") {
        convo.push({ role: "assistant", content: res.content });
        continue;
      }

      // Client tools requested — execute them and feed results back.
      if (res.stop_reason === "tool_use") {
        convo.push({ role: "assistant", content: res.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of res.content) {
          if (block.type !== "tool_use") continue;
          const result = await runTool(block.name, block.input);
          if (block.name === "search_products" && result.ok && Array.isArray(result.data)) {
            products = result.data as unknown[];
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result.ok ? result.data : { error: result.error }),
            is_error: !result.ok,
          });
        }
        convo.push({ role: "user", content: toolResults });
        continue;
      }

      // Done (end_turn) or a safety refusal — return whatever text we have.
      const reply = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      return NextResponse.json({
        reply:
          reply ||
          "Sorry — I couldn't answer that one. You can reach the team at info@globalsourceafrica.com.",
        products,
      });
    }

    return NextResponse.json({
      reply:
        "That took longer than expected. Could you rephrase, or reach the team directly at info@globalsourceafrica.com?",
      products,
    });
  } catch (err) {
    console.error("[api/chat] error:", err);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again shortly." },
      { status: 502 }
    );
  }
}
