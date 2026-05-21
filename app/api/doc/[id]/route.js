import { createServiceClient, getCurrentUser } from "../../../../lib/supabase-server";

// GET /api/doc/[id]
// Looks up a document and redirects the browser straight to the file
// (signed Storage URL or external link). This is what the AI links to in chat,
// so clicking opens the document directly instead of showing JSON.
export async function GET(request, { params }) {
  const auth = await getCurrentUser();
  const { id } = await params;

  // If not authenticated, send them to login (and back here after)
  if (!auth) {
    const loginUrl = new URL("/login", request.url);
    return Response.redirect(loginUrl, 302);
  }
  if (!id) {
    return Response.json({ error: "Document id required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: doc } = await service.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  // External link → redirect straight there
  if (doc.external_url) {
    return Response.redirect(doc.external_url, 302);
  }

  // Stored file → generate a signed URL and redirect to it
  if (doc.storage_path) {
    const { data: signed, error } = await service.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 600);
    if (error || !signed?.signedUrl) {
      return Response.json({ error: "Could not generate file link" }, { status: 500 });
    }
    return Response.redirect(signed.signedUrl, 302);
  }

  return Response.json({ error: "No file available for this document" }, { status: 404 });
}
