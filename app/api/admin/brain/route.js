import { createServiceClient, getCurrentUser, isAdminOrOwner } from "../../../../lib/supabase-server";

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return { error: "Not authenticated", status: 401 };
  if (!isAdminOrOwner(auth.profile)) return { error: "Admin only", status: 403 };
  return { auth };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const service = createServiceClient();
  const { data, error } = await service.from("brain")
    .select("id, title, content, source_url, created_by, updated_by, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ entries: data || [] });
}

export async function POST(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { title, content, source_url } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return Response.json({ error: "Title and content are required" }, { status: 400 });
  }
  const service = createServiceClient();
  const { data, error } = await service.from("brain").insert({
    title: title.trim(),
    content: content.trim(),
    source_url: source_url?.trim() || null,
    created_by: check.auth.user.id,
    updated_by: check.auth.user.id,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ entry: data });
}

export async function PATCH(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { id, title, content, source_url } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (!title?.trim() || !content?.trim()) {
    return Response.json({ error: "Title and content are required" }, { status: 400 });
  }
  const service = createServiceClient();
  const { error } = await service.from("brain").update({
    title: title.trim(),
    content: content.trim(),
    source_url: source_url?.trim() || null,
    updated_by: check.auth.user.id,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { id } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const service = createServiceClient();
  const { error } = await service.from("brain").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
