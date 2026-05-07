"use client";
import { useState, useRef, useEffect } from "react";

const P = "#673AB6", P2 = "#5E35B1";

const WELCOME = `**Hello Oolian! 👋 How can I help you today?**

I'm your AI onboarding buddy! Ask me about Oolio products, pricing, processes, tools, or anything you need to know.

Try asking:
• What's the difference between Oolio One and OrderMate?
• How do I submit leave?
• What's included in Oolio Full Service?`;

function fmt(t) {
  return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n- /g, "<br/>• ").replace(/\n• /g, "<br/>• ")
    .replace(/\n/g, "<br/>");
}

export default function ChatView() {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: WELCOME, id: "welcome" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({}); // { messageId: 'helpful' | 'not_helpful' }
  const [correctingId, setCorrectingId] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role: "user", content: userText }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const apiMessages = newMsgs.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }));
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await r.json();
      if (data.error) {
        setMsgs(p => [...p, { role: "assistant", content: "⚠️ " + data.error }]);
      } else {
        setMsgs(p => [...p, { role: "assistant", content: data.answer, id: data.messageId, sources: data.sourcesUsed, product: data.productDetected }]);
      }
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const sendFeedback = async (messageId, rating) => {
    if (!messageId) return;
    setFeedback(f => ({ ...f, [messageId]: rating }));
    try {
      await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {}
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-start", animation: "fadeIn 0.2s" }}>
              {m.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>O</div>
              )}
              <div style={{
                maxWidth: "82%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                background: m.role === "user" ? `linear-gradient(135deg, ${P}, ${P2})` : "white",
                color: m.role === "user" ? "white" : "#1a1a2e",
                fontSize: 14, lineHeight: 1.55,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                border: m.role === "user" ? "none" : "1px solid rgba(103,58,182,0.06)",
              }} dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
            </div>
            {m.role === "assistant" && m.id && m.id !== "welcome" && (
              <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 36, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => sendFeedback(m.id, "helpful")} style={fbBtn(feedback[m.id] === "helpful")} aria-label="Helpful">
                  👍 {feedback[m.id] === "helpful" ? "Thanks!" : "Helpful"}
                </button>
                <button onClick={() => sendFeedback(m.id, "not_helpful")} style={fbBtn(feedback[m.id] === "not_helpful")} aria-label="Not helpful">
                  👎 Not quite
                </button>
                <button onClick={() => setCorrectingId(m.id)} style={{ ...fbBtn(false), color: P }}>
                  ✏️ Correct this
                </button>
                {m.sources > 0 && (
                  <span style={{ fontSize: 10, color: "#999", marginLeft: 4 }}>
                    📚 {m.sources} source{m.sources !== 1 ? "s" : ""}{m.product ? ` · ${m.product}` : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>O</div>
            <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 3px", background: "white", display: "flex", gap: 5, border: "1px solid rgba(103,58,182,0.06)" }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: P, opacity: 0.3, animation: `bounce 1.2s ${j * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px 14px", background: "white", borderTop: "1px solid rgba(103,58,182,0.04)", flexShrink: 0 }}>
        <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: "flex", gap: 8, background: "#F4F2F7", borderRadius: 12, padding: "4px 4px 4px 14px", alignItems: "center" }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything..." disabled={loading} autoComplete="off"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "10px 0", minWidth: 0 }} />
          <button type="submit" disabled={loading || !input.trim()} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" /></svg>
          </button>
        </form>
        <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", marginTop: 6 }}>AI-powered · Always verify with your team</div>
      </div>

      {correctingId && <CorrectionModal messageId={correctingId} onClose={() => setCorrectingId(null)} />}
    </div>
  );
}

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
  const [product, setProduct] = useState("oolio");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!correctedAnswer.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/correction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, whatWasWrong, correctedAnswer, sourceUrl, product }),
      });
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {}
    setSubmitting(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: 0 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{ background: "white", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
        {done ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: P, marginTop: 12 }}>Thanks!</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Your correction has been sent for admin review.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: P, marginBottom: 4 }}>Suggest a correction</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>An admin will review your correction before it becomes part of the trusted knowledge base.</div>

            <Lbl>What was wrong with the answer?</Lbl>
            <textarea value={whatWasWrong} onChange={e => setWhatWasWrong(e.target.value)} placeholder="Optional — e.g. 'Outdated pricing' or 'Wrong process'" style={{ ...inpStyle, minHeight: 60 }} />

            <Lbl>Correct answer (required)</Lbl>
            <textarea value={correctedAnswer} onChange={e => setCorrectedAnswer(e.target.value)} required placeholder="The correct information..." style={{ ...inpStyle, minHeight: 80 }} />

            <Lbl>Source link (optional)</Lbl>
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." style={inpStyle} />

            <Lbl>Product</Lbl>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {["oolio", "ordermate", "bepoz", "general"].map(p => (
                <button key={p} type="button" onClick={() => setProduct(p)} style={{ padding: "7px 14px", borderRadius: 100, border: `2px solid ${product === p ? P : "rgba(103,58,182,0.12)"}`, background: product === p ? "rgba(103,58,182,0.08)" : "white", color: product === p ? P : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{p}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd", background: "white", color: "#666", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={submitting || !correctedAnswer.trim()} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: correctedAnswer.trim() ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", fontWeight: 700, fontSize: 14, cursor: correctedAnswer.trim() ? "pointer" : "default" }}>
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

const Lbl = ({ children }) => <label style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5, marginTop: 10 }}>{children}</label>;
const inpStyle = { width: "100%", padding: "10px 14px", border: "2px solid rgba(103,58,182,0.12)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAFD", marginBottom: 4, resize: "vertical" };
