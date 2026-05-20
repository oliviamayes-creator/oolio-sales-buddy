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
  const { data } = await service.from("knowledge").select("*").order("created_at", { ascending: false }).limit(200);
  return Response.json({ knowledge: data || [] });
}

export async function POST(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { topic, content, product, category, source_url } = await request.json();
  if (!topic?.trim() || !content?.trim()) return Response.json({ error: "Topic and content required" }, { status: 400 });
  const service = createServiceClient();
  await service.from("knowledge").insert({
    topic: topic.trim(), content: content.trim(),
    product: product || "general", category: category?.trim() || null,
    source_url: source_url?.trim() || null,
    approved: true, created_by: check.auth.user.id, approved_by: check.auth.user.id,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { id } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const service = createServiceClient();
  await service.from("knowledge").delete().eq("id", id);
  return Response.json({ ok: true });
}
