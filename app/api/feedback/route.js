import { createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const { messageId, rating } = await request.json();
    if (!messageId || !["helpful", "not_helpful"].includes(rating)) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }
    const service = createServiceClient();
    await service.from("feedback").insert({ message_id: messageId, user_id: auth.user.id, rating });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
