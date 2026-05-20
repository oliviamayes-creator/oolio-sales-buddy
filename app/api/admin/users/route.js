import { createServiceClient, getCurrentUser, isAdminOrOwner, isOwner } from "../../../../lib/supabase-server";

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
  const { data, error } = await service.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ users: data });
}

export async function PATCH(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { userId, role, active } = await request.json();
  const callerIsOwner = isOwner(check.auth.profile);

  // Look up target user to enforce owner protection server-side
  const service = createServiceClient();
  const { data: target } = await service.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  // Owner can only be modified by themselves (and only role can change to/from owner via the owner)
  if (target.role === "owner" && target.id !== check.auth.user.id) {
    return Response.json({ error: "Only the owner can modify the owner role" }, { status: 403 });
  }
  // Non-owners cannot promote anyone to owner
  if (role === "owner" && !callerIsOwner) {
    return Response.json({ error: "Only owner can grant owner role" }, { status: 403 });
  }

  const allowedRoles = callerIsOwner
    ? ["owner", "admin", "manager", "sales_rep", "viewer"]
    : ["admin", "manager", "sales_rep", "viewer"];

  const update = {};
  if (role && allowedRoles.includes(role)) update.role = role;
  if (typeof active === "boolean") {
    if (target.role === "owner") return Response.json({ error: "Owner cannot be deactivated" }, { status: 403 });
    update.active = active;
  }
  if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await service.from("profiles").update(update).eq("id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
