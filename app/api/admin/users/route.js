import { createServiceClient, getCurrentUser } from "../../../../lib/supabase-server";

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return { error: "Not authenticated", status: 401 };
  if (auth.profile?.role !== "admin") return { error: "Admin only", status: 403 };
  return { auth };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const service = createServiceClient();
  const { data, error } = await service.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ users: data });
}

export async function PATCH(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { userId, role, active } = await request.json();
  if (userId === check.auth.user.id) return Response.json({ error: "Cannot modify self" }, { status: 400 });
  
  const update = {};
  if (role && ["admin", "manager", "sales_rep", "viewer"].includes(role)) update.role = role;
  if (typeof active === "boolean") update.active = active;
  if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });
  
  const service = createServiceClient();
  const { error } = await service.from("profiles").update(update).eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
