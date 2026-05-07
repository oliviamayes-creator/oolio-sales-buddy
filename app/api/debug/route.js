import { getCurrentUser } from "../../../lib/supabase-server";

// Returns which env vars are available to the server runtime.
// Admin-only. Does NOT leak values.
export async function GET() {
  const auth = await getCurrentUser().catch(() => null);
  if (!auth || auth.profile?.role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }
  
  const status = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
  };
  
  // Show first/last 4 chars of service role key to verify it's not corrupt
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const skPreview = sk ? `${sk.slice(0, 6)}...${sk.slice(-4)} (length: ${sk.length})` : "MISSING";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const urlPreview = url ? url : "MISSING";
  
  return Response.json({
    status,
    serviceRoleKeyPreview: skPreview,
    supabaseUrlPreview: urlPreview,
    note: "All values must be 'true' for the app to work fully.",
  });
}
