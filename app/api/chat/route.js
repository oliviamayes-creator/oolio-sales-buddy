import { createClient, createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

const SYSTEM_PROMPT = `You are Oolio Onboard, the friendly and energetic AI assistant for the Oolio Group sales team. Oolio is an Australian hospitality technology company. Purpose: "Facilitating Celebration."

CRITICAL RULES:
- DEFAULT to Oolio One. Always assume the user is asking about Oolio One unless they explicitly name another product. Do NOT ask the user "which product do you mean?" — just answer for Oolio One.
- The Oolio Group portfolio includes 6 POS brands. Only mention or compare to other brands when:
  (a) the user explicitly asks about that brand, OR
  (b) the user describes a customer/venue that is clearly NOT a fit for Oolio One — in which case you can briefly suggest the better-suited brand and route them to the right team.
- NEVER blend feature/pricing/process information between brands — they are separate products.
- Prefer the APPROVED KNOWLEDGE provided below over your general training.
- For ROADMAP questions (what's coming, what's in development, what's shipped, beta features), use the LIVE ROADMAP DATA below if provided. The roadmap is at https://tree.oolio.com/tree and is the source of truth — managed by the dev team and updated continuously. Always link users there for the freshest info.
- If you don't have approved knowledge on something specific, say so honestly and suggest who to ask.
- Be concise, energetic, and helpful. Use a friendly tone with occasional emojis.
- End every response with: "Just a heads up — my answers are AI-generated, so always double-check with your manager or team if unsure!"

THE OOLIO GROUP PORTFOLIO (high-level — for recommending when a venue is a better fit elsewhere):
- **Oolio One** — Cloud-native POS + payments. The flagship and default. Best fit: modern restaurants, cafes, QSR, multi-site hospitality groups.
- **OrderMate** — Server-based POS. Best fit: high-end fine dining and premium restaurant groups.
- **Bepoz** — Enterprise POS. Best fit: pubs, clubs, gaming venues, large enterprise hospitality.
- **Swiftpos** — Stadia and large-format POS. Best fit: stadiums, arenas, exhibition centres.
- **Deliverit** — QSR + delivery POS. Best fit: pizza chains, QSR, delivery-heavy operations.
- **Idealpos** — Versatile POS. Best fit: clubs, pubs, retail with strong loyalty/membership integration needs.

When recommending another brand because Oolio One isn't the right fit, suggest the user route the lead to the right team rather than going deep on the other product's features yourself.`;

// Detect product from question for knowledge filtering. Defaults to oolio when not specified.
function detectProduct(q) {
  const text = q.toLowerCase();
  if (/\bordermate\b|\bom\b/.test(text)) return "ordermate";
  if (/\bbepoz\b/.test(text)) return "bepoz";
  if (/\bswiftpos\b|\bswift pos\b/.test(text)) return "swiftpos";
  if (/\bdeliverit\b|\bdeliver it\b/.test(text)) return "deliverit";
  if (/\bidealpos\b|\bideal pos\b/.test(text)) return "idealpos";
  return "oolio";
}

// Detect when the user is asking about the roadmap / upcoming features
function isRoadmapQuestion(q) {
  const text = q.toLowerCase();
  return /\b(roadmap|upcoming|coming soon|coming up|planned|scheduled|in development|being built|building|in beta|beta features|new features|shipped|just launched|just shipped|considering|future|whats next|what's next|next release|release notes|tree\.oolio)\b/.test(text);
}

// In-memory cache for tree.oolio.com (5 min TTL)
let roadmapCache = { content: null, fetchedAt: 0 };
const ROADMAP_TTL_MS = 5 * 60 * 1000;

async function getRoadmap() {
  const now = Date.now();
  if (roadmapCache.content && (now - roadmapCache.fetchedAt) < ROADMAP_TTL_MS) {
    return roadmapCache.content;
  }
  try {
    const r = await fetch("https://tree.oolio.com/tree", {
      headers: { "User-Agent": "OolioOnboard/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Strip HTML tags, collapse whitespace, keep structure
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    roadmapCache = { content: text, fetchedAt: now };
    return text;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    // ─── DIAGNOSTIC: check env vars are loaded ───
    const missing = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
    if (missing.length > 0) {
      return Response.json({
        error: `Missing env vars on server: ${missing.join(", ")}. Check Vercel Settings → Environment Variables and redeploy.`
      }, { status: 500 });
    }

    const auth = await getCurrentUser();
    if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const { user, profile } = auth;

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
    const detectedProduct = detectProduct(lastUserMessage);

    // ─── RETRIEVAL: pull approved knowledge ───
    const supabase = await createClient();
    const queryWords = lastUserMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 6);
    const tsQuery = queryWords.join(" | "); // OR search

    let knowledgeQuery = supabase
      .from("knowledge")
      .select("topic, content, product, source_url")
      .eq("approved", true);

    // Filter by product if detected
    if (detectedProduct) {
      knowledgeQuery = knowledgeQuery.in("product", [detectedProduct, "general"]);
    }

    // Try full-text search first; fall back to recent
    let { data: knowledgeChunks } = tsQuery
      ? await knowledgeQuery.textSearch("topic", tsQuery, { type: "websearch", config: "english" }).limit(8)
      : await knowledgeQuery.order("created_at", { ascending: false }).limit(10);

    // If TS search returned nothing, fallback to ILIKE
    if (!knowledgeChunks || knowledgeChunks.length === 0) {
      const ilike = "%" + queryWords.join("%") + "%";
      const fallback = await knowledgeQuery.or(`topic.ilike.${ilike},content.ilike.${ilike}`).limit(8);
      knowledgeChunks = fallback.data || [];
    }

    // Build the knowledge context block
    let knowledgeBlock = "";
    if (knowledgeChunks && knowledgeChunks.length > 0) {
      knowledgeBlock = "\n\nAPPROVED INTERNAL KNOWLEDGE (use this first, prioritise over your training):\n" +
        knowledgeChunks.map((k, i) =>
          `[${i + 1}] (${k.product}) ${k.topic}\n${k.content}${k.source_url ? `\nSource: ${k.source_url}` : ""}`
        ).join("\n\n");
    }

    // ─── ROADMAP RETRIEVAL: fetch tree.oolio.com if relevant ───
    let roadmapBlock = "";
    let roadmapUsed = false;
    if (isRoadmapQuestion(lastUserMessage)) {
      const roadmap = await getRoadmap();
      if (roadmap) {
        roadmapBlock = `\n\nLIVE ROADMAP DATA (from https://tree.oolio.com/tree — managed by the dev team, contains current shipped/beta/building/considering features grouped by area):\n${roadmap}\n\nWhen answering, summarise relevant sections and ALWAYS link the user to https://tree.oolio.com/tree for the freshest view.`;
        roadmapUsed = true;
      }
    }

    const systemPrompt = SYSTEM_PROMPT + knowledgeBlock + roadmapBlock + `\n\nCurrent user: ${profile?.name || user.email}`;

    // ─── CALL CLAUDE ───
    const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await apiResp.json();
    if (data.error) {
      return Response.json({ error: data.error.message || "AI error" }, { status: 500 });
    }
    const answer = data.content?.[0]?.text || "Sorry, I couldn't generate a response.";

    // ─── LOG MESSAGE (use service client to bypass RLS for system writes) ───
    const service = createServiceClient();
    const { data: logged } = await service.from("chat_messages").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.name || user.email,
      question: lastUserMessage,
      answer,
      product_detected: detectedProduct,
      knowledge_used: [
        ...(knowledgeChunks?.map(k => ({ topic: k.topic, product: k.product })) || []),
        ...(roadmapUsed ? [{ topic: "Live roadmap", source: "tree.oolio.com" }] : []),
      ],
    }).select("id").single();

    return Response.json({
      answer,
      messageId: logged?.id,
      sourcesUsed: (knowledgeChunks?.length || 0) + (roadmapUsed ? 1 : 0),
      productDetected: detectedProduct,
      roadmapUsed,
    });
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
