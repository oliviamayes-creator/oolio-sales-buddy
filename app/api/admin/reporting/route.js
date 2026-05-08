import { createServiceClient, getCurrentUser } from "../../../../lib/supabase-server";

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return { error: "Not authenticated", status: 401 };
  if (auth.profile?.role !== "admin") return { error: "Admin only", status: 403 };
  return { auth };
}

// Heuristic: did the AI's answer admit it didn't know?
function isUnansweredResponse(answer) {
  if (!answer) return false;
  const lower = answer.toLowerCase();
  return /don't have approved info|don't have specific|i don't have|i'm not sure|not certain|cannot find|couldn't find|no information|i don't know/i.test(lower);
}

// Extract topic keywords from a question
const TOPIC_KEYWORDS = {
  "Pricing": ["pricing","price","cost","quote","plan","fee","subscription","monthly"],
  "POS": ["pos","point of sale","terminal","till"],
  "Payments": ["payment","oolio pay","ooliopay","surcharge","settlement","eftpos"],
  "Hardware": ["hardware","printer","scanner","kds","display","tablet","mpos","kiosk"],
  "Integrations": ["integration","integrate","api","sevenrooms","xero","deputy","doshii","deliverect"],
  "Loyalty & Customers": ["loyalty","customer","gift card","membership","rewards"],
  "Online Ordering": ["online order","qr","online ordering","ubereats","doordash"],
  "Roadmap": ["roadmap","upcoming","coming soon","building","beta","shipped","considering"],
  "Process & HR": ["leave","ukg","onboard","training","install","hr"],
  "Reports": ["report","insight","analytics","dashboard","data"],
  "OrderMate": ["ordermate","fine dining"],
  "Bepoz": ["bepoz","pub","club"],
  "Swiftpos": ["swiftpos","stadia","stadium"],
  "Deliverit": ["deliverit","delivery","pizza"],
  "Idealpos": ["idealpos"],
};

function classifyTopic(question) {
  const q = (question || "").toLowerCase();
  const matches = [];
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
    if (words.some(w => q.includes(w))) matches.push(topic);
  }
  return matches.length > 0 ? matches : ["General"];
}

export async function GET(request) {
  const check = await requireAdmin();
  if (check.error) return Response.json({ error: check.error }, { status: check.status });
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get("days") || "7", 10), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const service = createServiceClient();

  // ─── MESSAGES ───
  const { data: messages } = await service.from("chat_messages")
    .select("id, user_id, user_name, user_email, question, answer, product_detected, knowledge_used, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const totalQueries = messages?.length || 0;

  // Active users
  const userActivity = {};
  for (const m of (messages || [])) {
    const key = m.user_email || m.user_name || "unknown";
    if (!userActivity[key]) userActivity[key] = { name: m.user_name, email: m.user_email, count: 0 };
    userActivity[key].count++;
  }
  const activeUsers = Object.values(userActivity).sort((a, b) => b.count - a.count);

  // Topic counts
  const topicCounts = {};
  for (const m of (messages || [])) {
    for (const t of classifyTopic(m.question)) {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
  }
  const topTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Product breakdown
  const productCounts = {};
  for (const m of (messages || [])) {
    const p = m.product_detected || "unknown";
    productCounts[p] = (productCounts[p] || 0) + 1;
  }

  // Daily volume for chart
  const dailyVolume = {};
  for (const m of (messages || [])) {
    const day = new Date(m.created_at).toISOString().slice(0, 10);
    dailyVolume[day] = (dailyVolume[day] || 0) + 1;
  }
  const dailySeries = Object.entries(dailyVolume)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Unanswered (gaps in knowledge)
  const unansweredQuestions = (messages || [])
    .filter(m => isUnansweredResponse(m.answer))
    .slice(0, 25)
    .map(m => ({
      id: m.id, question: m.question, user: m.user_name,
      product: m.product_detected, created_at: m.created_at,
    }));

  // Knowledge usage stats
  let queriesWithKnowledge = 0;
  let queriesWithRoadmap = 0;
  let queriesWithHelpDocs = 0;
  for (const m of (messages || [])) {
    const ku = m.knowledge_used;
    if (Array.isArray(ku)) {
      if (ku.some(k => k?.type === "knowledge" || k?.topic)) queriesWithKnowledge++;
      if (ku.some(k => k?.type === "roadmap" || k?.source === "tree.oolio.com")) queriesWithRoadmap++;
      if (ku.some(k => k?.type === "help_docs")) queriesWithHelpDocs++;
    }
  }

  // ─── FEEDBACK ───
  const { data: feedback } = await service.from("feedback")
    .select("rating, message_id, created_at")
    .gte("created_at", since);

  const feedbackCounts = { helpful: 0, not_helpful: 0 };
  for (const f of (feedback || [])) {
    if (f.rating === "helpful") feedbackCounts.helpful++;
    if (f.rating === "not_helpful") feedbackCounts.not_helpful++;
  }
  const totalFeedback = feedbackCounts.helpful + feedbackCounts.not_helpful;
  const helpfulRate = totalFeedback > 0 ? Math.round((feedbackCounts.helpful / totalFeedback) * 100) : null;

  // Find messages that got 👎 to surface bad answers
  const badMessageIds = new Set((feedback || []).filter(f => f.rating === "not_helpful").map(f => f.message_id));
  const badAnswers = (messages || [])
    .filter(m => badMessageIds.has(m.id))
    .slice(0, 10)
    .map(m => ({ id: m.id, question: m.question, user: m.user_name, created_at: m.created_at }));

  // ─── CORRECTIONS ───
  const { data: corrections } = await service.from("corrections")
    .select("status, created_at");
  const correctionCounts = { pending: 0, approved: 0, rejected: 0 };
  for (const c of (corrections || [])) {
    if (correctionCounts[c.status] !== undefined) correctionCounts[c.status]++;
  }

  // ─── KNOWLEDGE BASE SIZE ───
  const { count: knowledgeCount } = await service.from("knowledge").select("*", { count: "exact", head: true }).eq("approved", true);
  const { count: documentCount } = await service.from("documents").select("*", { count: "exact", head: true });
  const { count: userCount } = await service.from("profiles").select("*", { count: "exact", head: true });

  return Response.json({
    period: { days, since },
    summary: {
      totalQueries,
      activeUsersCount: activeUsers.length,
      knowledgeCount: knowledgeCount || 0,
      documentCount: documentCount || 0,
      userCount: userCount || 0,
      pendingCorrections: correctionCounts.pending,
    },
    activeUsers: activeUsers.slice(0, 15),
    topTopics: topTopics.slice(0, 12),
    productCounts,
    dailySeries,
    unansweredQuestions,
    badAnswers,
    feedback: {
      ...feedbackCounts,
      total: totalFeedback,
      helpfulRate,
    },
    sourceUsage: {
      withKnowledge: queriesWithKnowledge,
      withRoadmap: queriesWithRoadmap,
      withHelpDocs: queriesWithHelpDocs,
    },
    corrections: correctionCounts,
  });
}
