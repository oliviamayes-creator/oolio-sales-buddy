"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import AppShell from "./AppShell";

const P = "#673AB6", P2 = "#5E35B1";

const WELCOME_MD = `**Hello Oolian! 👋 How can I help you today?**

I'm your AI onboarding buddy. Ask me about Oolio products, pricing, processes, tools — anything you need to know.

Try one of these to get started:`;

const SUGGESTIONS = [
  "What's the difference between Oolio Core and Full Service?",
  "How do I submit leave through UKG?",
  "Which integrations do we support?",
  "What's on the Oolio roadmap?",
];

// Markdown renderer — light, safe, supports bold/italic/code/links/lists/headers
function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre style="background:#F4F2F7;padding:10px 12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:8px 0"><code>${code.trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(103,58,182,0.08);padding:1px 5px;border-radius:4px;font-size:0.92em">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<div style="font-size:14px;font-weight:700;margin:10px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:15px;font-weight:700;margin:12px 0 6px">$1</div>')
    .replace(/^# (.+)$/gm, '<div style="font-size:16px;font-weight:700;margin:14px 0 6px">$1</div>')
    // Bold + italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#673AB6;text-decoration:underline">$1</a>')
    // Bare URLs
    .replace(/(^|[^"=])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#673AB6;text-decoration:underline">$2</a>')
    // Lists
    .replace(/^[-•] (.+)$/gm, '<div style="margin-left:8px">• $1</div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="margin-left:8px">$1. $2</div>')
    // Tables (basic - just preserve as monospace blocks)
    .replace(/^\|(.+)\|$/gm, '<div style="font-family:monospace;font-size:12px">|$1|</div>')
    // Line breaks
    .replace(/\n\n+/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
  return html;
}

export default function ChatPage({ profile }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [followUps, setFollowUps] = useState([]);
  const [resolved, setResolved] = useState(false);
  const [feedback, setFeedback] = useState({}); // messageId -> 'helpful'/'not_helpful'
  const [correctingId, setCorrectingId] = useState(null);
  const [latestMessageId, setLatestMessageId] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading, streamingText]);

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setStreamingText("");
    setFollowUps([]);
    setResolved(false);
    setFeedback({});
    setLatestMessageId(null);
    setInput("");
    inputRef.current?.focus();
  }, []);

  const loadSession = useCallback(async (id) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/sessions?id=${id}`);
      const d = await r.json();
      if (d.session) {
        setSessionId(d.session.id);
        setResolved(d.session.resolved);
        setFollowUps([]);
        setStreamingText("");
        // Reconstruct messages array: each row has question (user) + answer (assistant)
        const reconstructed = [];
        for (const m of (d.messages || [])) {
          if (m.question) reconstructed.push({ role: "user", content: m.question });
          if (m.answer) reconstructed.push({ role: "assistant", content: m.answer, id: m.id });
        }
        setMessages(reconstructed);
        setLatestMessageId(d.messages?.length ? d.messages[d.messages.length - 1].id : null);
      }
    } catch {}
    setLoading(false);
  }, []);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setFollowUps([]);
    setStreamingText("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setLoading(true);
    setResolved(false);

    try {
      const apiMessages = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, sessionId, stream: true }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        setMessages(p => [...p, { role: "assistant", content: "⚠️ " + (errData.error || "Server error") }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let lastMessageId = null;
      let returnedSessionId = sessionId;
      let returnedTitle = null;
      let returnedFollowUps = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "meta") {
              if (evt.sessionId) returnedSessionId = evt.sessionId;
            } else if (evt.type === "delta") {
              accumulated += evt.text;
              setStreamingText(accumulated);
            } else if (evt.type === "done") {
              lastMessageId = evt.messageId;
              returnedFollowUps = evt.followUps || [];
              returnedTitle = evt.sessionTitle;
            } else if (evt.type === "error") {
              accumulated = accumulated + (accumulated ? "\n\n" : "") + "⚠️ " + evt.error;
            }
          } catch {}
        }
      }

      // Finalise: move streaming text into messages, set follow-ups
      setMessages(p => [...p, { role: "assistant", content: accumulated, id: lastMessageId }]);
      setStreamingText("");
      setLatestMessageId(lastMessageId);
      if (returnedSessionId && returnedSessionId !== sessionId) setSessionId(returnedSessionId);
      setFollowUps(returnedFollowUps);
    } catch (e) {
      setMessages(p => [...p, { role: "assistant", content: "⚠️ Connection error: " + e.message }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const sendFeedback = async (messageId, rating) => {
    if (!messageId) return;
    setFeedback(f => ({ ...f, [messageId]: rating }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {}
  };

  const markResolved = async () => {
    if (!sessionId) return;
    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, resolved: true }),
      });
      setResolved(true);
      setFollowUps([]);
    } catch {}
  };

  return (
    <AppShell profile={profile} onLoadSession={loadSession} onNewChat={startNewChat} activeSessionId={sessionId}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Welcome state */}
          {messages.length === 0 && !loading && (
            <div style={{ padding: "24px 12px", maxWidth: 580, margin: "0 auto", width: "100%" }}>
              <div style={{ background: "white", padding: "20px 22px", borderRadius: 16, border: "1px solid rgba(103,58,182,0.08)", boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(WELCOME_MD) }} />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: 10,
                    border: "1.5px solid rgba(103,58,182,0.12)",
                    background: "white", color: "#1a1a2e",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(103,58,182,0.05)"; e.currentTarget.style.borderColor = P; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "rgba(103,58,182,0.12)"; }}
                  >
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Message
              key={i}
              message={m}
              feedback={feedback}
              onFeedback={sendFeedback}
              onCorrect={() => setCorrectingId(m.id)}
              isLast={i === messages.length - 1}
            />
          ))}

          {/* Live streaming text */}
          {streamingText && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeIn 0.2s" }}>
              <Avatar />
              <div style={msgBubbleAi} dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) + '<span style="display:inline-block;width:8px;height:14px;background:#673AB6;margin-left:2px;animation:blink 1s infinite;vertical-align:middle"></span>' }} />
            </div>
          )}

          {/* Loading state (before first delta) */}
          {loading && !streamingText && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Avatar />
              <div style={{ ...msgBubbleAi, display: "flex", gap: 5, padding: "14px 18px" }}>
                {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: P, opacity: 0.4, animation: `bounce 1.2s ${j * 0.15}s infinite` }} />)}
              </div>
            </div>
          )}

          {/* Follow-ups + got-what-I-needed */}
          {!loading && followUps.length > 0 && !resolved && (
            <div style={{ marginTop: 6, paddingLeft: 40 }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                💡 Want to know more?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {followUps.map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    textAlign: "left", padding: "8px 12px", borderRadius: 10,
                    border: "1.5px solid rgba(103,58,182,0.12)",
                    background: "white", color: P,
                    fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(103,58,182,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
                  >
                    {q}
                  </button>
                ))}
                <button onClick={markResolved} style={{
                  textAlign: "left", padding: "8px 12px", borderRadius: 10,
                  border: "1.5px solid #16A34A",
                  background: "rgba(22,163,74,0.06)", color: "#16A34A",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  ✓ Got what I needed — thanks!
                </button>
              </div>
            </div>
          )}

          {/* Resolved celebration */}
          {resolved && (
            <div style={{ paddingLeft: 40, marginTop: 4, animation: "fadeIn 0.4s" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 100,
                background: "rgba(22,163,74,0.1)", color: "#15803D",
                fontSize: 11, fontWeight: 600,
              }}>
                🎉 Marked as resolved
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px 14px", background: "white", borderTop: "1px solid rgba(103,58,182,0.04)", flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: "flex", gap: 8, background: "#F4F2F7", borderRadius: 14, padding: "4px 4px 4px 14px", alignItems: "center" }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything..." disabled={loading} autoComplete="off"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "10px 0", minWidth: 0 }} />
            <button type="submit" disabled={loading || !input.trim()} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: input.trim() && !loading ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </form>
          <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", marginTop: 6 }}>AI-powered · Always verify with your team</div>
        </div>

        {correctingId && <CorrectionModal messageId={correctingId} onClose={() => setCorrectingId(null)} />}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </AppShell>
  );
}

function Message({ message, feedback, onFeedback, onCorrect, isLast }) {
  const isUser = message.role === "user";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-start", animation: "fadeIn 0.2s" }}>
        {!isUser && <Avatar />}
        <div style={isUser ? msgBubbleUser : msgBubbleAi}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
      </div>
      {!isUser && message.id && (
        <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 40, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => onFeedback(message.id, "helpful")} style={fbBtn(feedback[message.id] === "helpful")}>
            👍 {feedback[message.id] === "helpful" ? "Thanks!" : "Helpful"}
          </button>
          <button onClick={() => onFeedback(message.id, "not_helpful")} style={fbBtn(feedback[message.id] === "not_helpful")}>
            👎 Not quite
          </button>
          <button onClick={onCorrect} style={{ ...fbBtn(false), color: P }}>
            ✏️ Correct this
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar() {
  return <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>O</div>;
}

const msgBubbleUser = {
  maxWidth: "82%", padding: "10px 14px", borderRadius: "14px 14px 3px 14px",
  background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white",
  fontSize: 14, lineHeight: 1.55, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const msgBubbleAi = {
  maxWidth: "82%", padding: "10px 14px", borderRadius: "14px 14px 14px 3px",
  background: "white", color: "#1a1a2e",
  fontSize: 14, lineHeight: 1.55,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  border: "1px solid rgba(103,58,182,0.06)",
};

function fbBtn(active) {
  return {
    padding: "5px 10px", borderRadius: 100,
    border: `1px solid ${active ? P : "rgba(103,58,182,0.15)"}`,
    background: active ? "rgba(103,58,182,0.08)" : "white",
    color: active ? P : "#666", fontSize: 11, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  };
}

function CorrectionModal({ messageId, onClose }) {
  const [whatWasWrong, setWhatWasWrong] = useState("");
  const [correctedAnswer, setCorrectedAnswer] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!correctedAnswer.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/correction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, whatWasWrong, correctedAnswer, sourceUrl, product: "oolio" }),
      });
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {}
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{ background: "white", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
        {done ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: P, marginTop: 12 }}>Thanks!</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Your correction has been sent to admins for review.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: P, marginBottom: 4 }}>Suggest a correction</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>An admin will review before it becomes part of the Brain.</div>

            <Lbl>What was wrong?</Lbl>
            <textarea value={whatWasWrong} onChange={e => setWhatWasWrong(e.target.value)} placeholder="Optional context" style={{ ...modalInp, minHeight: 60 }} />

            <Lbl>Correct answer (required)</Lbl>
            <textarea value={correctedAnswer} onChange={e => setCorrectedAnswer(e.target.value)} required placeholder="The correct information..." style={{ ...modalInp, minHeight: 80 }} />

            <Lbl>Source link (optional)</Lbl>
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." style={modalInp} />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd", background: "white", color: "#666", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={submitting || !correctedAnswer.trim()} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: correctedAnswer.trim() ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", fontWeight: 700, fontSize: 14, cursor: correctedAnswer.trim() ? "pointer" : "default" }}>
                {submitting ? "Submitting..." : "Submit for review"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

const Lbl = ({ children }) => <label style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5, marginTop: 10 }}>{children}</label>;
const modalInp = { width: "100%", padding: "10px 14px", border: "2px solid rgba(103,58,182,0.12)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAFD", boxSizing: "border-box", resize: "vertical" };
