import { createServiceClient, getCurrentUser, isOwner } from "../../../lib/supabase-server";

// GET: list sessions for current user (or all sessions if owner & ?all=true)
// GET ?id=...: load full conversation
export async function GET(request) {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all") === "true";
  const query = url.searchParams.get("q") || "";
  const service = createServiceClient();

  // Load a specific session with all messages
  if (id) {
    const { data: session } = await service.from("chat_sessions")
      .select("*").eq("id", id).maybeSingle();
    if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
    // Owner can view any session; others only their own
    if (session.user_id !== auth.user.id && !isOwner(auth.profile)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data: messages } = await service.from("chat_messages")
      .select("id, role, question, answer, created_at, knowledge_used, product_detected")
      .eq("session_id", id)
      .order("created_at", { ascending: true });
    return Response.json({ session, messages: messages || [] });
  }

  // List sessions
  let listQuery = service.from("chat_sessions")
    .select("id, user_id, title, resolved, resolved_at, message_count, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (all && isOwner(auth.profile)) {
    // Owner sees all
  } else {
    listQuery = listQuery.eq("user_id", auth.user.id);
  }

  if (query.trim()) {
    listQuery = listQuery.ilike("title", `%${query.trim()}%`);
  }

  const { data: sessions, error } = await listQuery;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // For owner-all view, join in user info
  if (all && isOwner(auth.profile) && sessions?.length) {
    const userIds = [...new Set(sessions.map(s => s.user_id))];
    const { data: profiles } = await service.from("profiles").select("id, name, email").in("id", userIds);
    const userMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return Response.json({
      sessions: sessions.map(s => ({ ...s, user: userMap[s.user_id] || null })),
      isOwnerView: true,
    });
  }

  return Response.json({ sessions: sessions || [] });
}

// POST: create a new session
export async function POST(request) {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const service = createServiceClient();
  const { data, error } = await service.from("chat_sessions").insert({
    user_id: auth.user.id,
    title: body.title || "New chat",
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ session: data });
}

// PATCH: update session (rename, mark resolved)
export async function PATCH(request) {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { id, title, resolved } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const service = createServiceClient();
  const { data: session } = await service.from("chat_sessions")
    .select("user_id").eq("id", id).maybeSingle();
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  if (session.user_id !== auth.user.id && !isOwner(auth.profile)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const update = {};
  if (typeof title === "string" && title.trim()) update.title = title.trim().slice(0, 200);
  if (typeof resolved === "boolean") {
    update.resolved = resolved;
    update.resolved_at = resolved ? new Date().toISOString() : null;
  }
  if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });
  const { error } = await service.from("chat_sessions").update(update).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// DELETE: remove a session
export async function DELETE(request) {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const service = createServiceClient();
  const { data: session } = await service.from("chat_sessions")
    .select("user_id").eq("id", id).maybeSingle();
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  if (session.user_id !== auth.user.id && !isOwner(auth.profile)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error } = await service.from("chat_sessions").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
