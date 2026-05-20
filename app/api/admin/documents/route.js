import { createServiceClient, getCurrentUser, isAdminOrOwner } from "../../../../lib/supabase-server";

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return { error: "Not authenticated", status: 401 };
  if (!isAdminOrOwner(auth.profile)) return { error: "Admin only", status: 403 };
  return { auth };
}

export async function POST(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const contentType = request.headers.get("content-type") || "";
  const service = createServiceClient();

  // Handle file upload
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const title = form.get("title")?.toString().trim();
    const description = form.get("description")?.toString().trim();
    const category = form.get("category")?.toString().trim() || "Sales";
    const product = form.get("product")?.toString().trim() || "general";
    if (!file || !title) return Response.json({ error: "File and title required" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: upErr } = await service.storage.from("documents").upload(path, file, { contentType: file.type });
    if (upErr) return Response.json({ error: "Upload failed: " + upErr.message }, { status: 500 });

    await service.from("documents").insert({
      title, description: description || null,
      category, product, file_type: ext,
      storage_path: path, uploaded_by: check.auth.user.id,
    });
    return Response.json({ ok: true });
  }

  // Handle link-only document
  const body = await request.json();
  const { title, description, category, product, file_type, external_url } = body;
  if (!title?.trim()) return Response.json({ error: "Title required" }, { status: 400 });
  await service.from("documents").insert({
    title: title.trim(), description: description?.trim() || null,
    category: category || "Sales", product: product || "general",
    file_type: file_type || "Link", external_url: external_url?.trim() || null,
    uploaded_by: check.auth.user.id,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const { id } = await request.json();
  const service = createServiceClient();
  const { data: doc } = await service.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (doc?.storage_path) await service.storage.from("documents").remove([doc.storage_path]);
  await service.from("documents").delete().eq("id", id);
  return Response.json({ ok: true });
}

// Generate signed URL for private file download
export async function GET(request) {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const url = new URL(request.url);
  const docId = url.searchParams.get("id");
  if (!docId) return Response.json({ error: "id required" }, { status: 400 });
  const service = createServiceClient();
  const { data: doc } = await service.from("documents").select("*").eq("id", docId).single();
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
  if (doc.external_url) return Response.json({ url: doc.external_url });
  if (doc.storage_path) {
    const { data: signed } = await service.storage.from("documents").createSignedUrl(doc.storage_path, 600);
    return Response.json({ url: signed?.signedUrl });
  }
  return Response.json({ error: "No file available" }, { status: 404 });
}
