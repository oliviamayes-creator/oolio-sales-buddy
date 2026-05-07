import { createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

export async function GET() {
  // Check env vars first
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    return Response.json({ error: `Missing env vars: ${missing.join(", ")}` }, { status: 500 });
  }
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const service = createServiceClient();
  const { data, error } = await service.from("documents").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: "DB error: " + error.message }, { status: 500 });
  return Response.json({ documents: data || [] });
}
