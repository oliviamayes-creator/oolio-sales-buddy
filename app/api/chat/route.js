import { createClient, createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

const SYSTEM_PROMPT = `You are Oolio Onboard, the friendly and energetic AI assistant for the Oolio Group sales team. Oolio is an Australian hospitality technology company. Purpose: "Facilitating Celebration."

CRITICAL RULES:
- NEVER blend information between Oolio, OrderMate, and Bepoz — they are separate products with different features
- If product context is unclear, ask the user which product they mean before answering
- Prefer the APPROVED KNOWLEDGE provided below over your general training
- If you don't have approved knowledge on something specific, say so honestly and suggest who to ask
- Be concise, energetic, and helpful. Use a friendly tone with occasional emojis.
- End every response with: "Just a heads up — my answers are AI-generated, so always double-check with your manager or team if unsure!"

PRODUCT FAMILY OVERVIEW (use only when general context is needed):
- Oolio One (cloud-native POS, modern hospitality)
- OrderMate (server-based, fine dining and premium restaurants)  
- Bepoz (enterprise, pubs/clubs/large enterprise)
- Swiftpos (stadia and large enterprise)
- Deliverit (QSR and delivery)
- Idealpos (clubs, pubs, retail)`;

// Detect product from question for knowledge filtering
function detectProduct(q) {
  const text = q.toLowerCase();
  if (/\bordermate\b|\bom\b/.test(text)) return "ordermate";
  if (/\bbepoz\b/.test(text)) return "bepoz";
  if (/\boolio one\b|\boolio pay\b|\boolio platform\b|\boolio\b/.test(text)) return "oolio";
  return null;
}

export async function POST(request) {
  try {
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

    const systemPrompt = SYSTEM_PROMPT + knowledgeBlock + `\n\nCurrent user: ${profile?.name || user.email}`;

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
      knowledge_used: knowledgeChunks?.map(k => ({ topic: k.topic, product: k.product })) || [],
    }).select("id").single();

    return Response.json({
      answer,
      messageId: logged?.id,
      sourcesUsed: knowledgeChunks?.length || 0,
      productDetected: detectedProduct,
    });
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
