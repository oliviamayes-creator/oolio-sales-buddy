import { createServiceClient, getCurrentUser } from "../../../lib/supabase-server";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const service = createServiceClient();
  const { data } = await service.from("documents").select("*").order("created_at", { ascending: false });
  return Response.json({ documents: data || [] });
}
