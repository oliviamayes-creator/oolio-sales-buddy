"use client";
import { useEffect, useState } from "react";

const P = "#673AB6", P2 = "#5E35B1";

export default function AdminView({ profile }) {
  const [tab, setTab] = useState("brain");
  const isOwner = profile?.role === "owner";

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: P }}>Admin Panel</div>
          {isOwner && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "rgba(103,58,182,0.1)", color: P, fontWeight: 700, letterSpacing: "0.05em" }}>👑 OWNER</span>}
        </div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Knowledge curation, document library, team management</div>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "12px 12px", overflowX: "auto", borderBottom: "1px solid rgba(103,58,182,0.06)" }}>
        {[
          ["brain", "🧠 Oolio Brain"],
          ["corrections", "✏️ Corrections"],
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
        {tab === "brain" && <BrainTab />}
        {tab === "corrections" && <CorrectionsTab />}
        {tab === "documents" && <DocumentsTab />}
        {tab === "users" && <UsersTab profile={profile} />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </div>
  );
}

// ─── OOLIO BRAIN ───
function BrainTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | { id, title, content, source_url }
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/brain");
      const d = await r.json();
      if (d.error) { setErr(d.error); setEntries([]); }
      else setEntries(d.entries || []);
    } catch (e) { setErr("Network error: " + e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing("new");
    setTitle(""); setContent(""); setSourceUrl("");
    setErr(""); setMsg("");
  };
  const openEdit = (entry) => {
    setEditing(entry);
    setTitle(entry.title); setContent(entry.content); setSourceUrl(entry.source_url || "");
    setErr(""); setMsg("");
  };
  const closeEditor = () => {
    setEditing(null); setTitle(""); setContent(""); setSourceUrl("");
    setErr(""); setMsg("");
  };

  const save = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) { setErr("Title is required."); return; }
    if (!content.trim()) { setErr("Content is required."); return; }
    setBusy(true);
    try {
      if (editing === "new") {
        const r = await fetch("/api/admin/brain", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, source_url: sourceUrl || null }),
        });
        const d = await r.json();
        if (!r.ok) { setErr(d.error || "Failed to save"); setBusy(false); return; }
      } else {
        const r = await fetch("/api/admin/brain", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, title, content, source_url: sourceUrl || null }),
        });
        const d = await r.json();
        if (!r.ok) { setErr(d.error || "Failed to update"); setBusy(false); return; }
      }
      setMsg("Saved!");
      await load();
      setTimeout(closeEditor, 800);
    } catch (e) { setErr("Network error: " + e.message); }
    setBusy(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this Brain entry? It can't be undone.")) return;
    await fetch("/api/admin/brain", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const filtered = search.trim()
    ? entries.filter(e => (e.title + " " + e.content).toLowerCase().includes(search.toLowerCase()))
    : entries;

  if (editing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={closeEditor} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(103,58,182,0.15)", background: "white", color: P, cursor: "pointer", fontSize: 14 }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: P }}>{editing === "new" ? "Add Brain entry" : "Edit Brain entry"}</div>
        </div>

        <Lbl>Title</Lbl>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oolio Pay overview" style={inpStyle} />

        <Lbl>Content (Markdown supported — bold, lists, links, headers)</Lbl>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="The content the AI will use to answer questions related to this topic..." style={{ ...inpStyle, minHeight: 280, fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 13, lineHeight: 1.55 }} />
        <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
          💡 Tip: Use **bold**, lists with -, links [text](url), and headers like # H1, ## H2
        </div>

        <Lbl>Source URL (optional)</Lbl>
        <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://help.oolio.com/..." style={inpStyle} />

        {err && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 10, padding: 8, background: "rgba(220,38,38,0.06)", borderRadius: 8 }}>⚠️ {err}</div>}
        {msg && <div style={{ fontSize: 12, color: "#16A34A", marginTop: 10, padding: 8, background: "rgba(22,163,74,0.06)", borderRadius: 8 }}>✓ {msg}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={closeEditor} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #ddd", background: "white", color: "#666", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: busy ? "#D4D0DA" : `linear-gradient(135deg, ${P}, ${P2})`, color: "white", fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer" }}>
            {busy ? "Saving…" : editing === "new" ? "Add to Brain" : "Save changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search Brain..." style={{ ...inpStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={openNew} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>+ Add entry</button>
      </div>

      <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
        {entries.length} {entries.length === 1 ? "entry" : "entries"} · This is the AI's primary knowledge source
        {search && filtered.length !== entries.length && ` · ${filtered.length} matching`}
      </div>

      {err && <div style={{ fontSize: 12, color: "#DC2626", padding: 8, background: "rgba(220,38,38,0.06)", borderRadius: 8, marginBottom: 10 }}>⚠️ {err}</div>}

      {loading && <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🧠</div>
          <div style={{ fontSize: 13 }}>{search ? "No entries match your search." : "Brain is empty. Add your first entry to get started."}</div>
        </div>
      )}

      {filtered.map(e => (
        <div key={e.id} style={{ ...cardStyle, position: "relative" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", paddingRight: 60, marginBottom: 4 }}>{e.title}</div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.55, maxHeight: 80, overflow: "hidden", position: "relative" }}>
            {e.content.length > 240 ? e.content.slice(0, 240) + "…" : e.content}
          </div>
          {e.source_url && (
            <div style={{ fontSize: 10, color: P, marginTop: 6 }}>
              <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ color: P, textDecoration: "underline" }}>{e.source_url}</a>
            </div>
          )}
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>
            Updated {new Date(e.updated_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4 }}>
            <button onClick={() => openEdit(e)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "rgba(103,58,182,0.08)", color: P, cursor: "pointer", fontSize: 11 }} title="Edit">✏️</button>
            <button onClick={() => del(e.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "rgba(220,50,50,0.06)", color: "#DC3232", cursor: "pointer", fontSize: 11 }} title="Delete">🗑</button>
          </div>
        </div>
      ))}
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
function UsersTab({ profile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwner = profile?.role === "owner";

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (userId, body) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    load();
  };

  // Sort owner first, then admins, then everyone else
  const sorted = [...users].sort((a, b) => {
    const rank = r => r === "owner" ? 0 : r === "admin" ? 1 : r === "manager" ? 2 : 3;
    return rank(a.role) - rank(b.role);
  });

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Team members ({users.length})</div>
      {loading && <div style={{ textAlign: "center", padding: 30, color: "#999" }}>Loading…</div>}
      {sorted.map(u => {
        const targetIsOwner = u.role === "owner";
        const isSelf = u.id === profile?.id;
        // Only owner can modify owner; nobody can demote owner (other than themselves)
        const canChangeRole = !targetIsOwner || (isOwner && !isSelf);
        const canDeactivate = !targetIsOwner;

        return (
          <div key={u.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: targetIsOwner
                ? "linear-gradient(135deg, #F59E0B, #D97706)"
                : (u.role === "admin" ? `linear-gradient(135deg, ${P}, ${P2})` : "#E0D8ED"),
              color: targetIsOwner || u.role === "admin" ? "white" : P,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {targetIsOwner ? "👑" : (u.name || u.email).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                {u.name}
                {targetIsOwner && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: "rgba(245,158,11,0.12)", color: "#D97706", fontWeight: 700, letterSpacing: "0.05em" }}>OWNER</span>}
                {isSelf && <span style={{ fontSize: 9, color: "#aaa" }}>(you)</span>}
              </div>
              <div style={{ fontSize: 11, color: "#999" }}>{u.email}</div>
            </div>
            <select
              value={u.role}
              disabled={!canChangeRole}
              onChange={e => update(u.id, { role: e.target.value })}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(103,58,182,0.15)", fontSize: 11, fontFamily: "inherit", background: canChangeRole ? "white" : "#F4F2F7", color: canChangeRole ? "#1a1a2e" : "#aaa", cursor: canChangeRole ? "pointer" : "not-allowed" }}
            >
              {isOwner && <option value="owner">Owner</option>}
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales_rep">Sales Rep</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={() => update(u.id, { active: !u.active })}
              disabled={!canDeactivate}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(103,58,182,0.15)", background: u.active ? "white" : "rgba(220,50,50,0.06)", color: u.active ? P : "#DC2626", fontSize: 10, fontWeight: 600, cursor: canDeactivate ? "pointer" : "not-allowed", opacity: canDeactivate ? 1 : 0.4 }}
              title={!canDeactivate ? "Owner can't be deactivated" : ""}
            >
              {u.active ? "Active" : "Inactive"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── ACTIVITY / REPORTING ───
function ActivityTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/reporting?days=${days}`)
      .then(r => r.json())
      .then(d => { if (active) { setData(d); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days]);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading reports…</div>;
  if (!data || data.error) return <div style={{ textAlign: "center", padding: 40, color: "#DC2626" }}>{data?.error || "Couldn't load reporting data."}</div>;

  const { summary, activeUsers, topTopics, productCounts, dailySeries, unansweredQuestions, badAnswers, feedback, sourceUsage, corrections } = data;
  const maxDaily = Math.max(1, ...dailySeries.map(d => d.count));
  const maxUserCount = activeUsers[0]?.count || 1;
  const maxTopicCount = topTopics[0]?.count || 1;

  return (
    <div>
      {/* Time range filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: "6px 14px", borderRadius: 100,
            border: `2px solid ${days === d ? P : "rgba(103,58,182,0.12)"}`,
            background: days === d ? "rgba(103,58,182,0.08)" : "white",
            color: days === d ? P : "#888",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>Last {d} days</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
        <SummaryCard label="Total Questions" value={summary.totalQueries} icon="💬" />
        <SummaryCard label="Active Users" value={summary.activeUsersCount} icon="👤" />
        <SummaryCard label="Brain Entries" value={summary.brainCount} icon="🧠" />
        <SummaryCard label="Pending Corrections" value={summary.pendingCorrections} icon="✏️" alert={summary.pendingCorrections > 0} />
      </div>

      {/* Resolution rate (NEW) */}
      {summary.totalSessions > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Resolution Rate (Got what I needed)</Lbl>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: summary.resolutionRate >= 70 ? "#16A34A" : summary.resolutionRate >= 40 ? "#F59E0B" : "#DC2626" }}>
              {summary.resolutionRate}%
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "rgba(103,58,182,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${summary.resolutionRate}%`, height: "100%", background: summary.resolutionRate >= 70 ? "#16A34A" : summary.resolutionRate >= 40 ? "#F59E0B" : "#DC2626", transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                ✓ {summary.resolvedSessions} of {summary.totalSessions} chats marked resolved
                {summary.avgTurnsToResolve != null && ` · avg ${summary.avgTurnsToResolve} turns to resolve`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback rate */}
      {feedback.total > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Answer Quality (user feedback)</Lbl>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: feedback.helpfulRate >= 75 ? "#16A34A" : feedback.helpfulRate >= 50 ? "#F59E0B" : "#DC2626" }}>
              {feedback.helpfulRate}%
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "rgba(103,58,182,0.08)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(feedback.helpful / feedback.total) * 100}%`, background: "#16A34A" }} />
                <div style={{ width: `${(feedback.not_helpful / feedback.total) * 100}%`, background: "#DC2626" }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                👍 {feedback.helpful} helpful · 👎 {feedback.not_helpful} not helpful · ({feedback.total} rated)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily volume sparkline */}
      {dailySeries.length > 1 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Daily Question Volume</Lbl>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60, marginTop: 8 }}>
            {dailySeries.map(d => (
              <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, height: `${(d.count / maxDaily) * 100}%`, background: `linear-gradient(180deg, ${P}, ${P2})`, borderRadius: "3px 3px 0 0", minHeight: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginTop: 4 }}>
            <span>{dailySeries[0]?.date.slice(5)}</span>
            <span>{dailySeries[dailySeries.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Source usage breakdown */}
      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <Lbl>Where answers came from</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          <SmallStat label="Approved KB" value={sourceUsage.withKnowledge} total={summary.totalQueries} color={P} />
          <SmallStat label="Live roadmap" value={sourceUsage.withRoadmap} total={summary.totalQueries} color="#03A9F4" />
          <SmallStat label="Help docs" value={sourceUsage.withHelpDocs} total={summary.totalQueries} color="#16A34A" />
        </div>
      </div>

      {/* Top users */}
      {activeUsers.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Most active users</Lbl>
          <div style={{ marginTop: 8 }}>
            {activeUsers.slice(0, 8).map(u => (
              <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${P}, ${P2})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {(u.name || u.email || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</div>
                  <div style={{ height: 4, background: "rgba(103,58,182,0.08)", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(u.count / maxUserCount) * 100}%`, background: P }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: P, minWidth: 26, textAlign: "right" }}>{u.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top topics */}
      {topTopics.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Top topics asked</Lbl>
          <div style={{ marginTop: 8 }}>
            {topTopics.map(t => (
              <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{t.topic}</div>
                <div style={{ width: 90, height: 5, background: "rgba(103,58,182,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(t.count / maxTopicCount) * 100}%`, background: P }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: P, minWidth: 24, textAlign: "right" }}>{t.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product breakdown */}
      {Object.keys(productCounts).length > 1 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <Lbl>Product split</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {Object.entries(productCounts).sort((a, b) => b[1] - a[1]).map(([p, c]) => (
              <div key={p} style={{ padding: "5px 12px", borderRadius: 100, background: "rgba(103,58,182,0.08)", fontSize: 11, fontWeight: 600, color: P, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ textTransform: "capitalize" }}>{p}</span>
                <span style={{ background: P, color: "white", padding: "1px 7px", borderRadius: 100, fontSize: 10 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching: unanswered questions (knowledge gaps) */}
      {unansweredQuestions.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            ⚠️ Knowledge gaps ({unansweredQuestions.length})
          </div>
          <div style={{ fontSize: 11, color: "#92400E", marginBottom: 10 }}>
            Questions where the AI said "I don't have approved info." Add knowledge for these to improve answers.
          </div>
          {unansweredQuestions.slice(0, 8).map((q, i) => (
            <div key={q.id} style={{ padding: "8px 10px", background: "white", borderRadius: 8, marginBottom: 6, border: "1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize: 12, color: "#1a1a2e" }}>{q.question}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
                {q.user} · {new Date(q.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                {q.product && <span> · <span style={{ color: P, fontWeight: 600, textTransform: "uppercase" }}>{q.product}</span></span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coaching: bad answers (👎) */}
      {badAnswers.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14, background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            👎 Answers rated unhelpful ({badAnswers.length})
          </div>
          {badAnswers.map(b => (
            <div key={b.id} style={{ padding: "8px 10px", background: "white", borderRadius: 8, marginBottom: 6, border: "1px solid rgba(220,38,38,0.1)" }}>
              <div style={{ fontSize: 12 }}>{b.question}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>{b.user} · {new Date(b.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</div>
            </div>
          ))}
        </div>
      )}

      {summary.totalQueries === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 13 }}>No activity in the last {days} days yet.</div>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Once your team starts asking questions, this will fill up.</div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ label, value, icon, alert }) => (
  <div style={{ padding: 14, background: alert ? "rgba(245,158,11,0.06)" : "rgba(103,58,182,0.04)", border: alert ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(103,58,182,0.08)", borderRadius: 12, textAlign: "center" }}>
    <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: alert ? "#D97706" : P }}>{value}</div>
    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{label}</div>
  </div>
);

const SmallStat = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 9, color: "#bbb", marginTop: 2 }}>{pct}%</div>
    </div>
  );
};

const Lbl = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</div>;

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
