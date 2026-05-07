import { createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const body = await request.json();
    const { messageId, whatWasWrong, correctedAnswer, sourceUrl, product, category } = body;
    if (!correctedAnswer?.trim()) {
      return Response.json({ error: "Corrected answer is required" }, { status: 400 });
    }

    const service = createServiceClient();
    // Fetch the original message for context
    const { data: msg } = await service.from("chat_messages").select("question, answer").eq("id", messageId).maybeSingle();

    await service.from("corrections").insert({
      message_id: messageId,
      submitted_by: auth.user.id,
      submitter_name: auth.profile?.name || auth.user.email,
      original_question: msg?.question || null,
      original_answer: msg?.answer || null,
      what_was_wrong: whatWasWrong?.trim() || null,
      corrected_answer: correctedAnswer.trim(),
      source_url: sourceUrl?.trim() || null,
      product: product || "general",
      category: category?.trim() || null,
      status: "pending",
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
