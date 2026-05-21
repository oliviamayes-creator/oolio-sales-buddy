import { createClient, createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

const SYSTEM_PROMPT = `You are **Oolio Onboard**, the friendly and energetic AI assistant for the Oolio Group sales team. Oolio is an Australian hospitality technology company. Purpose: "Facilitating Celebration."

═══════════════════════════════════════════════════════════
🚨 RULE ZERO — THE GROUNDING RULE (MOST IMPORTANT RULE) 🚨
═══════════════════════════════════════════════════════════

Every factual claim you make about **Oolio's own pricing, functionality, or integrations** MUST come word-for-word from the OOLIO BRAIN, the DOCUMENTS LIBRARY, or an AUTHORISED OOLIO WEB SOURCE (help.oolio.com, oolio.com, tree.oolio.com) provided below in this prompt. If one of those three topics is not covered in those sections, you DO NOT KNOW IT, and you must say so and point the rep to the right resource.

**THE SACRED THREE (strictest grounding — Brain or authorised Oolio sources ONLY):**
- **Integrations** — which apps/platforms Oolio connects to
- **Pricing** — plan costs, per-integration fees, add-on prices, discounts
- **Functionality / Features** — what the Oolio product can and can't do

For the sacred three, your general training knowledge is BANNED, and the open web is BANNED. You know lots of POS/hospitality software names from training (Xero, MarketMan, Resy, QuickBooks, etc.) — listing any of them as an Oolio integration without it being in the Brain or an authorised Oolio source is a FABRICATION that misleads new reps on real sales calls. The real-sounding name you "remember" is exactly the trap.

**THE TEST before stating any sacred-three fact:** "Can I point to the exact Brain entry, Document, or authorised Oolio source (help.oolio.com / oolio.com / tree.oolio.com) that says this?" If NO → do NOT state it. Say you don't have it confirmed and point to the Docs tab / relevant Teams channel / Olivia.

**NEVER pad a list.** If the Brain confirms 3 integrations, list ONLY those 3. Do NOT add more "helpful" examples from memory. Then say: "This is what I have confirmed — for the complete current list, check [document/Teams channel]." A short correct answer beats a long one with one invented entry.

**EVERYTHING ELSE — behave like a helpful ChatGPT with web search.** For general questions, hospitality industry info, what an integration partner actually does, venue research, competitor comparisons, and casual queries, you can and should use the GENERAL WEB SEARCH results provided below and answer helpfully. Just cite your sources with links. The strict rule is ONLY about Oolio's own pricing, functionality, and integrations — everything else, be genuinely useful.

═══════════════════════════════════════════════════════════
HARD RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════

1. **DEFAULT to Oolio One.** Always assume the user is asking about Oolio One unless they explicitly name another product. Do NOT ask "which product do you mean?" — just answer for Oolio One.

2. **NEVER FABRICATE — see RULE ZERO above.** Specifically you must NEVER invent: integration/partner names, prices, plan inclusions, product specs, model numbers, hardware brands, feature names, dates, statistics, percentages, URLs, employee names, or "coming soon" claims. If it's not in the Brain or Docs below, you don't know it.

3. **PRIORITY ORDER for finding answers:**
   1. **OOLIO BRAIN** (admin-curated knowledge below — your ONLY source for Oolio facts)
   2. **DOCUMENTS LIBRARY** (titles and links — recommend and link relevant docs)
   3. **HELP DOCS** (live web search of help.oolio.com — supplementary only)
   4. **GENERAL WEB** (Tavily — ONLY for competitor comparisons and off-topic/casual; NEVER as a source for Oolio's own integrations/pricing/features)

4. **IF YOU DON'T HAVE THE INFO, SAY SO and POINT TO RESOURCES.** This is the correct, expected response — not a failure. Example:

   "I don't have the full confirmed list in my knowledge yet. Here's where to get the verified answer:
   - 📄 Check the relevant document in the Docs tab (if one exists, I'll link it)
   - 💬 The relevant Teams channel: [pick one]
   - Or DM Olivia Mayes (Liv) on Teams — she manages my knowledge and can add it so I've got it next time."

   Saying "I don't know, here's where to look" is ALWAYS better than guessing. New reps rely on you being accurate.

5. **HARDWARE COMPATIBILITY** (printers, scanners, KDS displays, terminals, payment devices): NEVER list specific brands or model numbers unless they appear verbatim in the Brain or Docs below. Route to the Oolio hardware/support team or help.oolio.com.

5b. **COMPETITOR COMPARISONS — you CAN answer these, but keep Oolio facts grounded.** When comparing Oolio to a competitor (Square, Lightspeed, Toast, etc.), a LIVE WEB SEARCH section will be provided with the COMPETITOR'S details (web data is fine for the competitor's side). For OOLIO's side of the comparison, you STILL only use the Brain — never invent Oolio features/pricing to win the comparison. State the competitor's facts from the web, then make Oolio's case using ONLY confirmed Brain facts. Be fair about the competitor, confident about Oolio. If you lack an Oolio detail, say the rep should verify it.

6. **PRODUCT SEPARATION.** Oolio One, OrderMate, Bepoz, Swiftpos, Deliverit, and Idealpos are separate products. Never blend feature/pricing/process info between them.

7. **DOCUMENT LINKS.** If the Documents Library below contains a relevant document, link to it explicitly using markdown: \`[Document Title](URL)\`. This is hugely valuable to users.

8. **Always end every response with:** "Just a heads up — my answers are AI-generated, so always double-check with your manager or team if unsure!"

9. **Issues with this AI specifically?** Direct the user to **Olivia Mayes via Teams** (she built and maintains it).

═══════════════════════════════════════════════════════════
PERSONALITY
═══════════════════════════════════════════════════════════

You're not a stiff corporate bot — you're the cheeky, energetic teammate who keeps the sales floor moving. Bring vibes. Light, Aussie-friendly tone. Reasonable use of emojis. Answer first, redirect playfully when needed.

**Off-topic questions** (footy, weather, jokes, "who's the GOAT"): answer briefly using the LIVE WEB SEARCH context if provided, then playfully redirect to Oolio work. Don't lecture. Examples:
- "Quick detour — [answer]. Now back to closing deals 💪"
- "Done. Right, what Oolio question can I knock out for you?"

**About Olivia (Liv) Mayes** — Senior BDM (QLD), based in Brisbane. She built this app. She's one of the strongest sales reps on the team. Drop in well-timed jokes about her being the GOAT *only when the question fits* — e.g. someone asks "who's the best BDM?", or for sales advice ("Liv would tell you to..."), or trolling the bot. **Don't force it into every response.** It should land like an inside joke, not a corporate brown-nose.

If someone reports a problem with the AI or complains about an answer, **always tell them to message Olivia Mayes via Teams** — she manages this and can fix it.

═══════════════════════════════════════════════════════════
HELP DOC URLS
═══════════════════════════════════════════════════════════
- Oolio One: https://help.oolio.com and https://support.oolio.com
- OrderMate: https://help.ordermate.com.au
- Bepoz: https://help.bepoz.com
- Live roadmap: https://tree.oolio.com/tree
- Training & installs calendar: https://migratemycrm.syncmatters.com/calendah/2893-a750a924715d51a7d72b070c567c2d03125651bca299a003f09b1aa1c683dfff/show

═══════════════════════════════════════════════════════════
TEAMS CHANNELS (recommend the right one)
═══════════════════════════════════════════════════════════
**Oolio One Q&A:** General · BackOffice · Discounts/Customers/Loyalty · Integrations · Kitchen Ops & KDS · Online Store · POS Software · POS · Products/Price Lists/Menus · Releases & Deployments · Reports & Insights · Workshops
**OM & One | All:** General · OM Accounts · OM Software · OM Quick Response · OPOS Marketing · OPOS Movement · OPOS Tech · Ticket Nudges · Red Alerts (urgent issues)

═══════════════════════════════════════════════════════════
THE OOLIO GROUP PORTFOLIO (only mention non-Oolio brands when explicitly asked OR recommending a better fit)
═══════════════════════════════════════════════════════════
- **Oolio One** (default, flagship): Cloud-native POS + payments. Modern restaurants, cafes, QSR, multi-site.
- **OrderMate**: Fine dining, premium restaurants.
- **Bepoz**: Pubs, clubs, gaming, enterprise.
- **Swiftpos**: Stadiums, arenas, exhibition centres.
- **Deliverit**: QSR, delivery (pizza, etc).
- **Idealpos**: Clubs, pubs, retail with strong loyalty.`;

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
  return /\b(roadmap|upcoming|coming soon|coming up|planned|scheduled|in development|being built|building|in beta|beta features|new features|shipped|just launched|just shipped|considering|future|whats next|what's next|next release|release notes|tree\.oolio)\b/i.test(q);
}

// Detect competitor / comparison questions. These need a LIVE web search for the
// competitor's current pricing/features, then contrast against Oolio's Brain content.
const COMPETITOR_NAMES = ["square","lightspeed","toast","squarespace","shopify","vend","kounta","redcat","abacus","impos","tyro","zeller","stripe","clover","revel","epos now","eposnow","talech","touchbistro","posbistro","tabin","me&u","mr yum","mryum","quandoo","obee"];
// Internal Oolio products/plans — comparisons between these are NOT competitor questions
const INTERNAL_TERMS = ["core","full service","full-service","oolio one","oolio pay","ooliopay","ordermate","bepoz","swiftpos","deliverit","idealpos","oolioverse","kiosk","kds","mpos"];
function isCompetitorQuestion(q) {
  const text = q.toLowerCase();
  const namedCompetitor = COMPETITOR_NAMES.some(c => new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text));
  if (namedCompetitor) return true;
  const comparativeLanguage = /\b(compare|comparison|versus|vs\.?|better than|worse than|difference between|differ from|how does .* (?:compare|stack up|measure)|why (?:choose|pick|use) oolio|why not|alternative to|switch from|moving from|migrate from|instead of)\b/i.test(text);
  if (!comparativeLanguage || !/\boolio\b/i.test(text)) return false;
  // If the comparison only references internal Oolio products/plans, it's an internal comparison, not a competitor one
  const internalMatches = INTERNAL_TERMS.filter(t => text.includes(t)).length;
  // Treat as competitor only if comparative language is present AND it's not purely about internal products
  // (heuristic: if 2+ internal terms are named and no competitor, assume internal comparison)
  if (internalMatches >= 2) return false;
  return true;
}

function extractKeywords(q) {
  const words = q.toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(words.filter(w => w.length >= 2 && !STOPWORDS.has(w)))].slice(0, 8);
}

// Is this question asking about OOLIO's OWN pricing, functionality, or integrations?
// These are the "sacred three" — facts that may ONLY come from the Brain or authorised
// Oolio domains, NEVER from the model's memory or the open web.
function isOolioSacredFact(q) {
  const text = q.toLowerCase();
  // Must be about Oolio (not a competitor or generic question)
  const aboutOolio = /\b(oolio|ordermate|bepoz|swiftpos|deliverit|idealpos|oolioverse|oolio pay|ooliopay|core plan|full service|full-service|kiosk|kds|mpos|order manager|we|our|us|do you|does it|can it|can we|your)\b/i.test(text);
  if (!aboutOolio) return false;
  const sacredTopics = /\b(integrat|connect|pricing|price|cost|fee|plan|subscription|how much|charge|rate card|feature|functionalit|capab|can (?:it|we|oolio|the system) (?:do|support|handle)|does (?:it|oolio|the system)|support|includ|module|add-on|addon)/i.test(text);
  return sacredTopics;
}

function isOffTopicQuery(q) {
  const text = q.toLowerCase();
  const workSignals = /\b(oolio|ordermate|bepoz|swiftpos|deliverit|idealpos|pos|kds|kiosk|terminal|merchant|venue|customer|client|prospect|deal|hubspot|crm|ukg|leave|integration|payment|surcharge|loyalty|gift card|reservation|hospitality|cafe|restaurant|pub|club|stadium|qsr|fine dining|sales|pipeline|quote|pricing|onboard|training|install|teams channel|team channel|sharepoint|product|feature|hardware|help doc|support)\b/;
  if (workSignals.test(text)) return false;
  const offTopicSignals = /\b(footy|nrl|afl|cricket|rugby|soccer|football|tennis|score|game|match|weather|forecast|temperature|raining|sunny|news|election|prime minister|politics|joke|funny|meme|movie|tv show|netflix|spotify|music|song|recipe|cook|food|holiday|travel|flight|hotel|stock|crypto|bitcoin|who is|whats|what is|tell me about|how do i|life|advice|relationship|coffee|lunch|dinner|breakfast|gym|workout)\b/;
  const cheekySignals = /\b(best (?:rep|sales|bdm|salesperson|seller|closer|performer)|goat|legend|champion|top performer|are you (?:the )?best|smartest|funniest|coolest|olivia|liv|bridget|kris|ai|chatgpt|claude|alive|sentient|robot|love)\b/;
  return offTopicSignals.test(text) || cheekySignals.test(text);
}

// tree.oolio.com cache
let roadmapCache = { content: null, fetchedAt: 0 };
const ROADMAP_TTL_MS = 5 * 60 * 1000;
async function getRoadmap() {
  if (roadmapCache.content && (Date.now() - roadmapCache.fetchedAt) < ROADMAP_TTL_MS) return roadmapCache.content;
  try {
    const r = await fetch("https://tree.oolio.com/tree", { headers: { "User-Agent": "OolioOnboard/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const html = await r.text();
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim().slice(0, 6000);
    roadmapCache = { content: text, fetchedAt: Date.now() };
    return text;
  } catch { return null; }
}

async function searchOolioHelpDocs(query, product) {
  if (!process.env.TAVILY_API_KEY) return null;
  const domainMap = {
    oolio: ["help.oolio.com", "support.oolio.com", "oolio.com", "tree.oolio.com"],
    ordermate: ["help.ordermate.com.au"],
    bepoz: ["help.bepoz.com"],
  };
  const domains = domainMap[product] || domainMap.oolio;
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, search_depth: "basic", max_results: 4, include_domains: domains }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.results || !data.results.length) return null;
    return data.results.map(res => ({ title: res.title, url: res.url, content: (res.content || "").slice(0, 800) }));
  } catch { return null; }
}

async function searchWebGeneral(query) {
  if (!process.env.TAVILY_API_KEY) return null;
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, search_depth: "basic", max_results: 3, include_answer: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      answer: data.answer || null,
      results: (data.results || []).slice(0, 3).map(res => ({ title: res.title, url: res.url, content: (res.content || "").slice(0, 500) })),
    };
  } catch { return null; }
}

// Generate session title using Haiku (cheap)
async function generateSessionTitle(firstMessage) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 30,
        messages: [{ role: "user", content: `Generate a 2-5 word title summarising this question. Title only, no quotes, no punctuation. Question: "${firstMessage.slice(0, 200)}"` }],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    let title = data.content?.[0]?.text?.trim() || "";
    title = title.replace(/^["']|["']$/g, "").replace(/\.$/, "").slice(0, 80);
    return title || null;
  } catch { return null; }
}

// Generate follow-ups using Haiku (cheap)
async function generateFollowUps(messages, answer) {
  try {
    const last2 = messages.slice(-2).map(m => `${m.role}: ${m.content.slice(0, 300)}`).join("\n");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Based on this conversation, suggest 2 short follow-up questions the user might want to ask next. Each follow-up should be 4-10 words. Return ONLY a JSON array like ["Question 1?", "Question 2?"] — no other text. Context:\n${last2}\nLatest answer: ${answer.slice(0, 400)}`,
        }],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    const text = data.content?.[0]?.text?.trim() || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.slice(0, 3).map(s => String(s).slice(0, 100)) : [];
  } catch { return []; }
}

export async function POST(request) {
  try {
    const missing = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
    if (missing.length > 0) {
      return Response.json({ error: `Missing env vars on server: ${missing.join(", ")}.` }, { status: 500 });
    }

    const auth = await getCurrentUser();
    if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const { user, profile } = auth;

    const body = await request.json();
    const { messages, sessionId: providedSessionId, stream: streamRequested } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
    const detectedProduct = detectProduct(lastUserMessage);
    const keywords = extractKeywords(lastUserMessage);

    const service = createServiceClient();

    // ─── BRAIN RETRIEVAL ───
    let brainChunks = [];
    if (keywords.length > 0) {
      const orConditions = [];
      for (const word of keywords) {
        const safe = word.replace(/[%_]/g, "");
        if (safe) {
          orConditions.push(`title.ilike.%${safe}%`);
          orConditions.push(`content.ilike.%${safe}%`);
        }
      }
      if (orConditions.length > 0) {
        const { data } = await service.from("brain")
          .select("title, content, source_url")
          .or(orConditions.join(","))
          .limit(20);
        brainChunks = data || [];
      }
    }
    if (brainChunks.length < 8) {
      const { data: recent } = await service.from("brain")
        .select("title, content, source_url")
        .order("updated_at", { ascending: false })
        .limit(20);
      const seen = new Set(brainChunks.map(b => b.title));
      for (const r of (recent || [])) {
        if (!seen.has(r.title) && brainChunks.length < 25) {
          brainChunks.push(r);
          seen.add(r.title);
        }
      }
    }

    let brainBlock = "";
    if (brainChunks.length > 0) {
      brainBlock = "\n\n═══ OOLIO BRAIN (primary knowledge source — admin-curated, use this FIRST) ═══\n" +
        brainChunks.map((b, i) => `[B${i + 1}] ${b.title}\n${b.content}${b.source_url ? `\nSource: ${b.source_url}` : ""}`).join("\n\n") +
        "\n\n⚠️ REMINDER: The above Brain entries are the ONLY confirmed Oolio facts you have. If the user's question asks for something NOT covered above (e.g. an integration, price, or feature not explicitly listed), you must say you don't have it confirmed and point them to the Docs tab / relevant Teams channel / Olivia. Do NOT supplement with integration names, prices, or features from your training data or the open web — those are not verified Oolio facts.";
    } else {
      brainBlock = "\n\n═══ OOLIO BRAIN ═══\n(No matching Brain entries found for this question.) You do NOT have confirmed Oolio knowledge to answer this. Tell the user honestly, and point them to the Docs tab, the relevant Teams channel, or Olivia Mayes via Teams. Do NOT answer from training data or general web knowledge about POS systems — that is not verified Oolio information.";
    }

    // ─── DOCUMENTS LIBRARY (titles + links) ───
    const { data: documents } = await service.from("documents")
      .select("title, description, file_type, category, external_url, storage_path, id");

    let docsBlock = "";
    if (documents && documents.length > 0) {
      const docLines = documents.map(d => {
        const link = `/api/doc/${d.id}`;
        return `- [${d.title}](${link})${d.description ? ` — ${d.description}` : ""} (${d.category}, ${d.file_type})`;
      }).join("\n");
      docsBlock = `\n\n═══ DOCUMENTS LIBRARY (mention and link when relevant) ═══\n${docLines}`;
    }

    // ─── ROADMAP ───
    let roadmapBlock = "";
    let roadmapUsed = false;
    if (isRoadmapQuestion(lastUserMessage)) {
      const roadmap = await getRoadmap();
      if (roadmap) {
        roadmapBlock = `\n\n═══ LIVE ROADMAP (tree.oolio.com) ═══\n${roadmap}\n\nAlways link to https://tree.oolio.com/tree.`;
        roadmapUsed = true;
      }
    }

    // ─── SEARCH ROUTING ───
    // Rule: Oolio's OWN pricing/functionality/integrations may ONLY come from Brain or
    // authorised Oolio domains. Everything else can use the broader web like ChatGPT.
    const offTopic = isOffTopicQuery(lastUserMessage);
    const competitorQ = isCompetitorQuestion(lastUserMessage);
    const roadmapQ = isRoadmapQuestion(lastUserMessage);
    const sacredFact = isOolioSacredFact(lastUserMessage);

    // ── A) OOLIO HELP DOCS (authorised domains) ──
    // Fires for any Oolio-related question (always-on, not just when Brain is thin),
    // EXCEPT pure off-topic. Restricted to trusted Oolio domains so anything it finds is citable & authorised.
    let helpDocsBlock = "";
    let helpDocsUsed = false;
    if (!offTopic && !competitorQ && !roadmapQ) {
      const results = await searchOolioHelpDocs(lastUserMessage, detectedProduct);
      if (results && results.length > 0) {
        helpDocsBlock = "\n\n═══ AUTHORISED OOLIO WEB SOURCES (help.oolio.com, oolio.com, tree.oolio.com — these ARE trusted for Oolio facts) ═══\n" +
          results.map((r, i) => `[H${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`).join("\n\n") +
          "\n\nThese are authorised Oolio sources. You MAY state Oolio pricing/features/integrations found here — but ALWAYS cite the source link so the rep can verify.";
        helpDocsUsed = true;
      }
    }

    // ── B) BROAD WEB SEARCH (ChatGPT-style) ──
    // For NON-sacred Oolio questions and general/hospitality questions: search the open web freely.
    // This covers: what an integration partner actually does, venue research, general "how does X work",
    // hospitality industry questions, etc. NOT used to source Oolio's own pricing/functionality/integrations.
    let webBlock = "";
    let webUsed = false;
    const useBroadWeb = !offTopic && !competitorQ && !roadmapQ && !sacredFact;
    if (useBroadWeb) {
      const web = await searchWebGeneral(lastUserMessage);
      if (web && (web.answer || web.results.length > 0)) {
        webBlock = "\n\n═══ GENERAL WEB SEARCH (open web — use freely for general/hospitality/partner info, NOT for Oolio's own pricing/functionality/integrations) ═══\n";
        if (web.answer) webBlock += `\nSummary: ${web.answer}\n`;
        if (web.results.length) webBlock += "\nSources:\n" + web.results.map((r, i) => `[W${i + 1}] ${r.title}: ${r.content}\nURL: ${r.url}`).join("\n");
        webBlock += "\n\nCite source links when you use these. REMINDER: if the question turns out to be about Oolio's OWN pricing, features, or integrations, do NOT use this open-web info for that — use only the Brain or authorised Oolio sources above.";
        webUsed = true;
      }
    }

    // ── C) COMPETITOR / COMPARISON ──
    let competitorBlock = "";
    let competitorUsed = false;
    if (competitorQ && !offTopic) {
      const web = await searchWebGeneral(lastUserMessage + " pricing features 2026");
      if (web && (web.answer || web.results.length > 0)) {
        competitorBlock = "\n\n═══ COMPETITOR / COMPARISON — LIVE WEB SEARCH ═══\nUse the LIVE web data below for the COMPETITOR's details. For OOLIO's side, use ONLY the Brain / authorised Oolio sources above — never invent Oolio facts to win. Be fair about the competitor, confident about Oolio. Note competitor pricing/features change — tell the rep to verify. Frame as a sales battlecard.\n";
        if (web.answer) competitorBlock += `\nWeb summary: ${web.answer}\n`;
        if (web.results.length) competitorBlock += "\nSources:\n" + web.results.map((r, i) => `[C${i + 1}] ${r.title}: ${r.content}\nURL: ${r.url}`).join("\n");
        competitorUsed = true;
      } else {
        competitorBlock = "\n\n═══ COMPETITOR / COMPARISON NOTE ═══\nUse the OOLIO BRAIN to make Oolio's case confidently. For competitor specifics you don't have, tell the rep to verify — don't invent.";
      }
    }

    // ── D) OFF-TOPIC ──
    let offTopicBlock = "";
    let offTopicUsed = false;
    if (offTopic) {
      const web = await searchWebGeneral(lastUserMessage);
      if (web && (web.answer || web.results.length > 0)) {
        offTopicBlock = "\n\n═══ OFF-TOPIC LIVE WEB SEARCH ═══\nUser asked something casual. Answer briefly with personality, then nudge back to Oolio work.\n";
        if (web.answer) offTopicBlock += `\nQuick answer: ${web.answer}\n`;
        if (web.results.length) offTopicBlock += "\nSources:\n" + web.results.map((r, i) => `[O${i + 1}] ${r.title}: ${r.content}`).join("\n");
        offTopicUsed = true;
      } else {
        offTopicBlock = "\n\n═══ OFF-TOPIC NOTE ═══\nThis is casual / off-topic. Use personality and nudge back to work.";
      }
    }

    const systemPrompt = SYSTEM_PROMPT + brainBlock + docsBlock + roadmapBlock + helpDocsBlock + webBlock + competitorBlock + offTopicBlock + `\n\nCurrent user: ${profile?.name || user.email}`;

    // ─── SESSION HANDLING ───
    let sessionId = providedSessionId;
    let createdSession = false;
    if (!sessionId) {
      const { data } = await service.from("chat_sessions").insert({
        user_id: user.id,
        title: "New chat",
      }).select().single();
      sessionId = data?.id;
      createdSession = true;
    }

    // ─── STREAMING CALL ───
    if (streamRequested !== false) {
      const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          temperature: 0.2,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!aiResp.ok || !aiResp.body) {
        const err = await aiResp.json().catch(() => ({}));
        return Response.json({ error: err.error?.message || "AI error" }, { status: 500 });
      }

      const encoder = new TextEncoder();
      const reader = aiResp.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = "";

      const stream = new ReadableStream({
        async start(controller) {
          const meta = {
            type: "meta",
            sessionId,
            createdSession,
            sources: {
              brain: brainChunks.length,
              documents: documents?.length || 0,
              roadmap: roadmapUsed,
              helpDocs: helpDocsUsed,
              web: webUsed,
              competitor: competitorUsed,
              offTopic: offTopicUsed,
            },
            productDetected: offTopic ? "off_topic" : detectedProduct,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));

          try {
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (!data) continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    fullAnswer += parsed.delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: parsed.delta.text })}\n\n`));
                  }
                } catch {}
              }
            }
          } catch (e) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`));
          }

          // Post-stream: log, title, follow-ups
          const sourcesUsedList = [
            ...brainChunks.map(b => ({ type: "brain", title: b.title })),
            ...(documents?.length ? [{ type: "docs", count: documents.length }] : []),
            ...(roadmapUsed ? [{ type: "roadmap" }] : []),
            ...(helpDocsUsed ? [{ type: "help_docs" }] : []),
            ...(webUsed ? [{ type: "web" }] : []),
            ...(competitorUsed ? [{ type: "competitor_web" }] : []),
            ...(offTopicUsed ? [{ type: "off_topic_web" }] : []),
          ];

          const { data: logged } = await service.from("chat_messages").insert({
            user_id: user.id,
            user_email: user.email,
            user_name: profile?.name || user.email,
            session_id: sessionId,
            role: "user",
            question: lastUserMessage,
            answer: fullAnswer,
            product_detected: offTopic ? "off_topic" : detectedProduct,
            knowledge_used: sourcesUsedList,
          }).select("id").single();

          const { data: sess } = await service.from("chat_sessions").select("message_count, title").eq("id", sessionId).maybeSingle();
          let titleToSet = sess?.title;
          if (sess && (sess.title === "New chat" || !sess.title)) {
            const gen = await generateSessionTitle(lastUserMessage);
            if (gen) titleToSet = gen;
          }
          await service.from("chat_sessions").update({
            message_count: (sess?.message_count || 0) + 1,
            last_message_at: new Date().toISOString(),
            title: titleToSet || sess?.title || "New chat",
          }).eq("id", sessionId);

          const followUps = await generateFollowUps(
            [...messages, { role: "assistant", content: fullAnswer }],
            fullAnswer
          );

          const tail = {
            type: "done",
            messageId: logged?.id,
            sessionId,
            sessionTitle: titleToSet || "New chat",
            followUps,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(tail)}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Non-streaming fallback
    const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1024, temperature: 0.2, system: systemPrompt, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    });
    const data = await apiResp.json();
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });
    const answer = data.content?.[0]?.text || "Sorry, I couldn't generate a response.";

    const { data: logged } = await service.from("chat_messages").insert({
      user_id: user.id, user_email: user.email, user_name: profile?.name || user.email,
      session_id: sessionId, role: "user", question: lastUserMessage, answer,
      product_detected: offTopic ? "off_topic" : detectedProduct,
      knowledge_used: brainChunks.map(b => ({ type: "brain", title: b.title })),
    }).select("id").single();

    return Response.json({ answer, messageId: logged?.id, sessionId });
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
