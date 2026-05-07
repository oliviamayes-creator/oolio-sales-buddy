import { createServiceClient, getCurrentUser } from "../../../../lib/supabase-server";

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return { error: "Not authenticated", status: 401 };
  if (auth.profile?.role !== "admin") return { error: "Admin only", status: 403 };
  return { auth };
}

export async function GET(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "pending";
  const service = createServiceClient();
  const { data, error } = await service.from("corrections")
    .select("*").eq("status", status).order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ corrections: data });
}

export async function PATCH(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { correctionId, action, editedAnswer, editedTopic } = await request.json();
  if (!correctionId || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  
  const service = createServiceClient();
  const { data: correction } = await service.from("corrections").select("*").eq("id", correctionId).single();
  if (!correction) return Response.json({ error: "Correction not found" }, { status: 404 });

  // If approved → create a new knowledge entry
  if (action === "approve") {
    await service.from("knowledge").insert({
      topic: editedTopic?.trim() || correction.original_question || "User correction",
      content: editedAnswer?.trim() || correction.corrected_answer,
      product: correction.product,
      category: correction.category,
      source_type: "user_correction",
      source_url: correction.source_url,
      approved: true,
      created_by: correction.submitted_by,
      approved_by: check.auth.user.id,
    });
  }

  await service.from("corrections").update({
    status: action === "approve" ? "approved" : "rejected",
    reviewed_by: check.auth.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", correctionId);

  return Response.json({ ok: true });
}
