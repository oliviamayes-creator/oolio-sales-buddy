import { createServiceClient, getCurrentUser, isAdminOrOwner } from "../../../../lib/supabase-server";

const STOPWORDS = new Set(["the","and","but","what","where","when","who","how","why","does","did","have","has","had","been","being","with","without","into","onto","from","about","that","this","these","those","your","yours","they","them","their","there","here","just","very","really","also","then","than","over","under","other","some","any","all","not","yes","you","yo","my","mine","our","ours","its","it's","can","could","would","should","may","might","will","shall","please","thanks","thank","hi","hello","hey","im","i'm"]);
function extractKeywords(q) {
  const words = q.toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(words.filter(w => w.length >= 2 && !STOPWORDS.has(w)))].slice(0, 8);
}

// GET /api/admin/brain-search?q=how much are the lenovo tablets
// Shows exactly which Brain entries the retrieval would return for a query,
// so you can diagnose whether pricing/hardware content is actually IN the Brain.
export async function GET(request) {
  const auth = await getCurrentUser().catch(() => null);
  if (!auth || !isAdminOrOwner(auth.profile)) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const service = createServiceClient();

  // Total brain count
  const { count: brainCount } = await service.from("brain").select("*", { count: "exact", head: true });

  // Keyword matches
  const keywords = extractKeywords(q);
  let keywordMatches = [];
  if (keywords.length > 0) {
    const orConditions = [];
    for (const word of keywords) {
      const safe = word.replace(/[%_]/g, "");
      if (safe) { orConditions.push(`title.ilike.%${safe}%`); orConditions.push(`content.ilike.%${safe}%`); }
    }
    const { data } = await service.from("brain").select("title").or(orConditions.join(",")).limit(25);
    keywordMatches = (data || []).map(d => d.title);
  }

  // Price-list style matches
  const { data: priceData } = await service.from("brain")
    .select("title")
    .or("title.ilike.%pricing%,title.ilike.%price%,title.ilike.%hardware%,title.ilike.%cost%,content.ilike.%price%,content.ilike.%rrp%")
    .limit(15);
  const priceMatches = (priceData || []).map(d => d.title);

  // Does ANY brain entry mention the key product words?
  const productProbe = {};
  for (const term of ["lenovo", "sunmi", "cpad", "tablet", "kiosk", "epson", "printer"]) {
    const { count } = await service.from("brain").select("*", { count: "exact", head: true }).ilike("content", `%${term}%`);
    productProbe[term] = count || 0;
  }

  // All brain titles (so you can see what's actually stored)
  const { data: allTitles } = await service.from("brain").select("title").order("updated_at", { ascending: false }).limit(100);

  return Response.json({
    query: q,
    brainTotalEntries: brainCount || 0,
    extractedKeywords: keywords,
    keywordMatchTitles: keywordMatches,
    priceListMatchTitles: priceMatches,
    productMentionCounts: productProbe,
    note: "productMentionCounts shows how many Brain entries contain each term in their CONTENT. If 'lenovo' is 0, the hardware pricing is NOT in the Brain (it's probably in the Documents library instead, which the AI can't read).",
    allBrainTitles: (allTitles || []).map(t => t.title),
  });
}
