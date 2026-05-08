import { createClient, createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

const SYSTEM_PROMPT = `You are Oolio Onboard, the friendly and energetic AI assistant for the Oolio Group sales team. Oolio is an Australian hospitality technology company. Purpose: "Facilitating Celebration."

═══════════════════════════════════════════════════════════
HARD RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════

1. **DEFAULT to Oolio One.** Always assume the user is asking about Oolio One unless they explicitly name another product. Do NOT ask "which product do you mean?" — just answer for Oolio One.

2. **NEVER FABRICATE.** You MUST NOT invent any of these — even if it would make a more helpful response:
   - Product specifications, model numbers, hardware brand names
   - Integration partner names not in the approved knowledge
   - Prices, dates, statistics, percentages
   - URLs, feature names, employee names
   - "Coming soon" claims about features

3. **IF YOU DON'T HAVE THE INFO, SAY SO.** When the approved knowledge, roadmap, or help-docs context below doesn't contain the specific answer, your response MUST be along these lines:

   "I don't have approved info on that specifically yet. Here are your best next steps:
   - Check the relevant Teams channel: [pick from list below]
   - Check the help docs: [link]
   - Ask [relevant team member or team]
   - And — please consider submitting a correction with the right answer once you find it, so I can help the next person who asks!"

   Saying "I don't know" is ALWAYS better than guessing. NEVER paper over a gap by giving generic POS-industry advice.

4. **HARDWARE COMPATIBILITY** (printers, scanners, KDS displays, terminals, payment devices): NEVER list specific brands or model numbers unless they are explicitly named in the approved knowledge below. Always direct the user to the Oolio hardware/support team or the relevant help docs URL.

5. **PRODUCT SEPARATION.** Never blend feature/pricing/process information between brands. Oolio One, OrderMate, Bepoz, Swiftpos, Deliverit, and Idealpos are separate products.

6. **Always end every response with:** "Just a heads up — my answers are AI-generated, so always double-check with your manager or team if unsure!"

═══════════════════════════════════════════════════════════
HELP DOC URLS (route users here when you can't answer)
═══════════════════════════════════════════════════════════
- Oolio One: https://help.oolio.com and https://support.oolio.com
- OrderMate: https://help.ordermate.com.au
- Bepoz: https://help.bepoz.com
- Roadmap (live): https://tree.oolio.com/tree
- Training & installs calendar: https://migratemycrm.syncmatters.com/calendah/2893-a750a924715d51a7d72b070c567c2d03125651bca299a003f09b1aa1c683dfff/show

═══════════════════════════════════════════════════════════
TEAMS CHANNELS (always recommend the right one)
═══════════════════════════════════════════════════════════
**Oolio One Q&A:** General · BackOffice · Discounts/Customers/Loyalty · Integrations · Kitchen Ops & KDS · Online Store · POS Software · POS · Products/Price Lists/Menus · Releases & Deployments · Reports & Insights · Workshops
**OM & One | All:** General · OM Accounts · OM Software · OM Quick Response · OPOS Marketing · OPOS Movement · OPOS Tech · Ticket Nudges · Red Alerts (urgent issues)

═══════════════════════════════════════════════════════════
THE OOLIO GROUP PORTFOLIO (only mention non-Oolio brands when explicitly asked OR recommending a better fit)
═══════════════════════════════════════════════════════════
- **Oolio One** (default, flagship): Cloud-native POS + payments. Modern restaurants, cafes, QSR, multi-site groups.
- **OrderMate**: Server-based. High-end fine dining, premium restaurants.
- **Bepoz**: Enterprise. Pubs, clubs, gaming venues, large enterprise.
- **Swiftpos**: Stadia/large-format. Stadiums, arenas, exhibition centres.
- **Deliverit**: QSR/delivery. Pizza chains, delivery-heavy operations.
- **Idealpos**: Versatile. Clubs, pubs, retail with strong loyalty.

═══════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════
Friendly, energetic, concise. Occasional emojis. Use "Oolian" affectionately. Be direct — answer the question first, then add context.`;

const STOPWORDS = new Set(["the","and","but","what","where","when","who","how","why","does","did","have","has","had","been","being","with","without","into","onto","from","about","that","this","these","those","your","yours","they","them","their","there","here","just","very","really","also","then","than","over","under","other","some","any","all","not","yes","you","yo","my","mine","our","ours","its","it's","can","could","would","should","may","might","will","shall","please","thanks","thank","hi","hello","hey","im","i'm"]);

function detectProduct(q) {
  const text = q.toLowerCase();
  if (/\bordermate\b|\bom\b/.test(text)) return "ordermate";
  if (/\bbepoz\b/.test(text)) return "bepoz";
  if (/\bswiftpos\b|\bswift pos\b/.test(text)) return "swiftpos";
  if (/\bdeliverit\b|\bdeliver it\b/.test(text)) return "deliverit";
  if (/\bidealpos\b|\bideal pos\b/.test(text)) return "idealpos";
  return "oolio";
}

function isRoadmapQuestion(q) {
  const text = q.toLowerCase();
  return /\b(roadmap|upcoming|coming soon|coming up|planned|scheduled|in development|being built|building|in beta|beta features|new features|shipped|just launched|just shipped|considering|future|whats next|what's next|next release|release notes|tree\.oolio)\b/.test(text);
}

// Extract significant keywords from a query
function extractKeywords(q) {
  const words = q.toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(words.filter(w => w.length >= 2 && !STOPWORDS.has(w)))].slice(0, 8);
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
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, " ").trim().slice(0, 6000);
    roadmapCache = { content: text, fetchedAt: now };
    return text;
  } catch { return null; }
}

// Tavily web search restricted to Oolio help domains
async function searchOolioHelpDocs(query, product) {
  if (!process.env.TAVILY_API_KEY) return null;
  const domainMap = {
    oolio: ["help.oolio.com", "support.oolio.com", "oolio.com"],
    ordermate: ["help.ordermate.com.au"],
    bepoz: ["help.bepoz.com"],
  };
  const domains = domainMap[product] || domainMap.oolio;
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query, search_depth: "basic", max_results: 4,
        include_domains: domains,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.results || data.results.length === 0) return null;
    return data.results.map(res => ({
      title: res.title,
      url: res.url,
      content: (res.content || "").slice(0, 800),
    }));
  } catch { return null; }
}

export async function POST(request) {
  try {
    const missing = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
    if (missing.length > 0) {
      return Response.json({
        error: `Missing env vars on server: ${missing.join(", ")}.`
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
    const keywords = extractKeywords(lastUserMessage);

    // ─── KNOWLEDGE RETRIEVAL ───
    const supabase = await createClient();
    const productFilter = [detectedProduct, "general"];

    let knowledgeChunks = [];

    // Strategy 1: Search topic + content with ILIKE for each significant keyword
    if (keywords.length > 0) {
      const orConditions = [];
      for (const word of keywords) {
        const safe = word.replace(/[%_]/g, ""); // sanitize
        if (safe) {
          orConditions.push(`topic.ilike.%${safe}%`);
          orConditions.push(`content.ilike.%${safe}%`);
        }
      }
      if (orConditions.length > 0) {
        const { data } = await supabase.from("knowledge")
          .select("topic, content, product, source_url, category")
          .eq("approved", true)
          .in("product", productFilter)
          .or(orConditions.join(","))
          .limit(20);
        knowledgeChunks = data || [];
      }
    }

    // Strategy 2: Always include the most recent N entries as broad context (Claude can sift through)
    const { data: recent } = await supabase.from("knowledge")
      .select("topic, content, product, source_url, category")
      .eq("approved", true)
      .in("product", productFilter)
      .order("created_at", { ascending: false })
      .limit(15);

    const seen = new Set(knowledgeChunks.map(k => k.topic));
    for (const r of (recent || [])) {
      if (!seen.has(r.topic) && knowledgeChunks.length < 30) {
        knowledgeChunks.push(r);
        seen.add(r.topic);
      }
    }

    let knowledgeBlock = "";
    if (knowledgeChunks.length > 0) {
      knowledgeBlock = "\n\n═══ APPROVED INTERNAL KNOWLEDGE (use this FIRST — admins have explicitly approved this content) ═══\n" +
        knowledgeChunks.map((k, i) =>
          `[${i + 1}] (${k.product}${k.category ? "/" + k.category : ""}) ${k.topic}\n${k.content}${k.source_url ? `\nSource: ${k.source_url}` : ""}`
        ).join("\n\n");
    } else {
      knowledgeBlock = "\n\n═══ APPROVED INTERNAL KNOWLEDGE ═══\n(No matching approved knowledge found for this query.)";
    }

    // ─── ROADMAP ───
    let roadmapBlock = "";
    let roadmapUsed = false;
    if (isRoadmapQuestion(lastUserMessage)) {
      const roadmap = await getRoadmap();
      if (roadmap) {
        roadmapBlock = `\n\n═══ LIVE ROADMAP (https://tree.oolio.com/tree — use for "what's coming/shipped/in beta" questions) ═══\n${roadmap}\n\nALWAYS link the user to https://tree.oolio.com/tree for the freshest view.`;
        roadmapUsed = true;
      }
    }

    // ─── HELP DOCS FALLBACK (Tavily) ───
    // Trigger when internal knowledge is sparse — search oolio's official help domains
    let helpDocsBlock = "";
    let helpDocsUsed = false;
    const shouldUseHelpDocs = knowledgeChunks.length < 5 && !isRoadmapQuestion(lastUserMessage);
    if (shouldUseHelpDocs) {
      const results = await searchOolioHelpDocs(lastUserMessage, detectedProduct);
      if (results && results.length > 0) {
        helpDocsBlock = "\n\n═══ OOLIO HELP DOCS (live web search) ═══\n" +
          results.map((r, i) => `[H${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`).join("\n\n") +
          "\n\nIMPORTANT: When citing these results, ALWAYS include the source URL so the user can read the full article.";
        helpDocsUsed = true;
      }
    }

    const systemPrompt = SYSTEM_PROMPT + knowledgeBlock + roadmapBlock + helpDocsBlock + `\n\nCurrent user: ${profile?.name || user.email}`;

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
    if (data.error) return Response.json({ error: data.error.message || "AI error" }, { status: 500 });
    const answer = data.content?.[0]?.text || "Sorry, I couldn't generate a response.";

    // ─── LOG ───
    const service = createServiceClient();
    const sourcesUsedList = [
      ...(knowledgeChunks.map(k => ({ type: "knowledge", topic: k.topic, product: k.product }))),
      ...(roadmapUsed ? [{ type: "roadmap", source: "tree.oolio.com" }] : []),
      ...(helpDocsUsed ? [{ type: "help_docs", source: "tavily" }] : []),
    ];
    const { data: logged } = await service.from("chat_messages").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.name || user.email,
      question: lastUserMessage,
      answer,
      product_detected: detectedProduct,
      knowledge_used: sourcesUsedList,
    }).select("id").single();

    return Response.json({
      answer,
      messageId: logged?.id,
      sourcesUsed: sourcesUsedList.length,
      sourceBreakdown: {
        knowledge: knowledgeChunks.length,
        roadmap: roadmapUsed,
        helpDocs: helpDocsUsed,
      },
      productDetected: detectedProduct,
    });
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
