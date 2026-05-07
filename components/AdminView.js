"use client";
import { useEffect, useState } from "react";

const P = "#673AB6", P2 = "#5E35B1";

export default function AdminView() {
  const [tab, setTab] = useState("corrections");

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: P }}>Admin Panel</div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Knowledge moderation & team management</div>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "12px 12px", overflowX: "auto", borderBottom: "1px solid rgba(103,58,182,0.06)" }}>
        {[
          ["corrections", "✏️ Corrections"],
          ["knowledge", "🧠 Knowledge"],
          ["documents", "📄 Documents"],
          ["users", "👥 Users"],
          ["activity", "📊 Activity"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: tab === id ? `linear-gradient(135deg, ${P}, ${P2})` : "transparent", color: tab === id ? "white" : "#888", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {tab === "corrections" && <CorrectionsTab />}
        {tab === "knowledge" && <KnowledgeTab />}
        {tab === "documents" && <DocumentsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </div>
  );
}

// ─── CORRECTIONS ───
function CorrectionsTab() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/corrections?status=${filter}`);
    const d = await r.json();
    setItems(d.corrections || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const review = async (id, action, editedAnswer, editedTopic) => {
    await fetch("/api/admin/corrections", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctionId: id, action, editedAnswer, editedTopic }),
    });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "7px 14px", borderRadius: 100, border: filter === s ? `2px solid ${P}` : "2px solid rgba(103,58,182,0.12)", background: filter === s ? "rgba(103,58,182,0.08)" : "white", color: filter === s ? P : "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>
        ))}
      </div>
      {loading && <div style={{ color: "#999", textAlign: "center", padding: 20 }}>Loading...</div>}
      {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#bbb" }}>No {filter} corrections.</div>}
      {items.map(c => <CorrectionCard key={c.id} c={c} onReview={review} />)}
    </div>
  );
}

function CorrectionCard({ c, onReview }) {
  const [editAns, setEditAns] = useState(c.corrected_answer);
  const [editTopic, setEditTopic] = useState(c.original_question || "");
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    setBusy(true);
    await onReview(c.id, action, editAns, editTopic);
    setBusy(false);
  };

  const isPending = c.status === "pending";
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
        {c.submitter_name} · {new Date(c.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })} · <span style={{ color: P, fontWeight: 600, textTransform: "uppercase" }}>{c.product}</span>
      </div>
      {c.original_question && (
        <Section label="Original question"><div style={{ fontSize: 13, color: "#555" }}>{c.original_question}</div></Section>
      )}
      {c.original_answer && (
        <Section label="Original AI answer"><div style={{ fontSize: 12, color: "#888", background: "#FAFAFD", padding: "8px 10px", borderRadius: 8 }}>{c.original_answer}</div></Section>
      )}
      {c.what_was_wrong && (
        <Section label="What was wrong"><div style={{ fontSize: 13, color: "#DC2626" }}>{c.what_was_wrong}</div></Section>
      )}
      <Section label="Corrected answer">
        {isPending ? (
          <textarea value={editAns} onChange={e => setEditAns(e.target.value)} style={{ ...inpStyle, minHeight: 80 }} />
        ) : (
          <div style={{ fontSize: 13, color: "#1a1a2e" }}>{c.corrected_answer}</div>
        )}
      </Section>
      {isPending && (
        <Section label="Topic / title for knowledge base">
          <input value={editTopic} onChange={e => setEditTopic(e.target.value)} style={inpStyle} />
        </Section>
      )}
      {c.source_url && (
        <Section label="Source"><a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: P }}>{c.source_url}</a></Section>
      )}
      {isPending && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => act("reject")} disabled={busy} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid rgba(220,50,50,0.3)", background: "white", color: "#DC2626", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Reject</button>
          <button onClick={() => act("approve")} disabled={busy} style={{ flex: 2, padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #16A34A, #15803D)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{busy ? "..." : "✓ Approve & Add to Knowledge"}</button>
        </div>
      )}
      {!isPending && (
        <div style={{ marginTop: 8, fontSize: 11, color: c.status === "approved" ? "#16A34A" : "#DC2626", fontWeight: 600, textTransform: "uppercase" }}>{c.status}</div>
      )}
    </div>
  );
}

// ─── KNOWLEDGE ───
function KnowledgeTab() {
  const [items, setItems] = useState([]);
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [product, setProduct] = useState("oolio");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await fetch("/api/admin/knowledge");
    const d = await r.json();
    setItems(d.knowledge || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!topic.trim() || !content.trim()) return;
    setBusy(true);
    await fetch("/api/admin/knowledge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, content, product, category, source_url: sourceUrl }),
    });
    setTopic(""); setContent(""); setCategory(""); setSourceUrl("");
    setBusy(false);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete this knowledge entry?")) return;
    await fetch("/api/admin/knowledge", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div>
      <div style={{ ...cardStyle, background: "rgba(103,58,182,0.02)", border: `1.5px solid rgba(103,58,182,0.12)` }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: P }}>Add new knowledge entry</div>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g. 'Pricing for Bepoz')" style={inpStyle} />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content / answer" style={{ ...inpStyle, minHeight: 80, marginTop: 8 }} />
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {["oolio", "ordermate", "bepoz", "general"].map(p => (
            <button key={p} onClick={() => setProduct(p)} style={pillBtn(product === p)}>{p}</button>
          ))}
        </div>
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (optional)" style={{ ...inpStyle, marginTop: 8 }} />
        <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Source URL (optional)" style={{ ...inpStyle, marginTop: 8 }} />
        <button onClick={add} disabled={busy || !topic.trim() || !content.trim()} style={{ width: "100%", padding: 10, marginTop: 10, borderRadius: 10, border: "none", background: topic.trim() && content.trim() ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{busy ? "..." : "Add Knowledge"}</button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>All entries ({items.length})</div>
      {items.map(k => (
        <div key={k.id} style={{ ...cardStyle, position: "relative" }}>
          <div style={{ fontSize: 13, fontWeight: 600, paddingRight: 30 }}>{k.topic}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4, lineHeight: 1.5 }}>{k.content}</div>
          <div style={{ fontSize: 10, color: P, fontWeight: 600, marginTop: 6, textTransform: "uppercase" }}>{k.product}{k.category ? ` · ${k.category}` : ""}</div>
          <button onClick={() => del(k.id)} style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(220,50,50,0.06)", color: "#DC3232", cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── DOCUMENTS ───
function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Sales");
  const [product, setProduct] = useState("oolio");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setErr("");
    try {
      const r = await fetch("/api/documents");
      const d = await r.json();
      if (d.error) { setErr("Couldn't load documents: " + d.error); setDocs([]); return; }
      setDocs(d.documents || []);
    } catch (e) {
      setErr("Network error loading documents: " + e.message);
    }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) { setErr("Document title is required."); return; }
    if (!file && !externalUrl.trim()) { setErr("Add either a file OR an external link."); return; }
    setBusy(true);
    try {
      let r;
      if (file) {
        const fd = new FormData();
        fd.append("file", file); fd.append("title", title.trim()); fd.append("description", desc);
        fd.append("category", cat); fd.append("product", product);
        r = await fetch("/api/admin/documents", { method: "POST", body: fd });
      } else {
        r = await fetch("/api/admin/documents", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), description: desc, category: cat, product, external_url: externalUrl, file_type: "Link" }),
        });
      }
      const data = await r.json();
      if (!r.ok || data.error) {
        setErr("Upload failed: " + (data.error || "Server returned " + r.status));
      } else {
        setMsg("Document added!");
        setTitle(""); setDesc(""); setExternalUrl(""); setFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
        load();
        setTimeout(() => setMsg(""), 2500);
      }
    } catch (e) {
      setErr("Network error: " + e.message);
    }
    setBusy(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/admin/documents", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div>
      <div style={{ ...cardStyle, background: "rgba(103,58,182,0.02)", border: `1.5px solid rgba(103,58,182,0.12)` }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: P }}>Add new document</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title (required)" style={inpStyle} />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" style={{ ...inpStyle, marginTop: 8 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 10, marginBottom: 5 }}>Category</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Sales", "Product", "Training", "Process", "Other"].map(c => (
            <button key={c} onClick={() => setCat(c)} style={pillBtn(cat === c)}>{c}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 10, marginBottom: 5 }}>Product</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["oolio", "ordermate", "bepoz", "general"].map(p => (
            <button key={p} onClick={() => setProduct(p)} style={pillBtn(product === p)}>{p}</button>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: 12, background: "#FAFAFD", borderRadius: 10, border: "1px dashed rgba(103,58,182,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: P, marginBottom: 6 }}>Upload a file</div>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ fontSize: 12 }} />
          {file && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{file.name}</div>}
          <div style={{ fontSize: 11, color: "#999", marginTop: 8, marginBottom: 4 }}>OR provide an external link:</div>
          <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://sharepoint.com/..." disabled={!!file} style={inpStyle} />
        </div>
        {err && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 10, padding: 8, background: "rgba(220,38,38,0.06)", borderRadius: 8 }}>⚠️ {err}</div>}
        {msg && <div style={{ fontSize: 12, color: "#16A34A", marginTop: 10, padding: 8, background: "rgba(22,163,74,0.06)", borderRadius: 8 }}>✓ {msg}</div>}
        <button onClick={add} disabled={busy} style={{ width: "100%", padding: 11, marginTop: 10, borderRadius: 10, border: "none", background: busy ? "#D4D0DA" : `linear-gradient(135deg, ${P}, ${P2})`, color: "white", fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer" }}>
          {busy ? "Uploading..." : "Add Document"}
        </button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>All documents ({docs.length})</div>
      {docs.map(d => (
        <div key={d.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(103,58,182,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, fontWeight: 700, color: P }}>{d.file_type}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{d.category} · {d.product}</div>
          </div>
          <button onClick={() => del(d.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "rgba(220,50,50,0.06)", color: "#DC3232", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── USERS ───
function UsersTab() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    setUsers(d.users || []);
  };
  useEffect(() => { load(); }, []);

  const update = async (userId, body) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    load();
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Team members ({users.length})</div>
      {users.map(u => (
        <div key={u.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "admin" ? `linear-gradient(135deg, ${P}, ${P2})` : "#E0D8ED", color: u.role === "admin" ? "white" : P, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {(u.name || u.email).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{u.email}</div>
          </div>
          <select value={u.role} onChange={e => update(u.id, { role: e.target.value })} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(103,58,182,0.15)", fontSize: 11, fontFamily: "inherit", background: "white" }}>
            <option value="sales_rep">Sales Rep</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={() => update(u.id, { active: !u.active })} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(103,58,182,0.15)", background: u.active ? "white" : "rgba(220,50,50,0.06)", color: u.active ? P : "#DC2626", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            {u.active ? "Active" : "Inactive"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ACTIVITY ───
function ActivityTab() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>Activity Dashboard</div>
      <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>Coming next sprint — usage analytics, top topics, coaching insights.</div>
      <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>For now, all activity is being logged in the chat_messages and feedback tables.</div>
    </div>
  );
}

// ─── SHARED ───
const cardStyle = { padding: "14px 16px", background: "white", borderRadius: 12, border: "1px solid rgba(103,58,182,0.08)", marginBottom: 10 };
const inpStyle = { width: "100%", padding: "10px 14px", border: "2px solid rgba(103,58,182,0.12)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#FAFAFD", boxSizing: "border-box", resize: "vertical" };
const pillBtn = (active) => ({ padding: "6px 12px", borderRadius: 100, border: `2px solid ${active ? P : "rgba(103,58,182,0.12)"}`, background: active ? "rgba(103,58,182,0.08)" : "white", color: active ? P : "#888", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" });

const Section = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);
