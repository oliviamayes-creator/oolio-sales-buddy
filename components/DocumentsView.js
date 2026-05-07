"use client";
import { useEffect, useState } from "react";

const P = "#673AB6";

export default function DocumentsView() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/documents");
      const data = await r.json();
      setDocs(data.documents || []);
    } catch {}
    setLoading(false);
  };

  const open = async (doc) => {
    if (doc.external_url) { window.open(doc.external_url, "_blank"); return; }
    if (doc.storage_path) {
      const r = await fetch(`/api/admin/documents?id=${doc.id}`);
      const data = await r.json();
      if (data.url) window.open(data.url, "_blank");
    }
  };

  const cats = ["Sales", "Product", "Training", "Process", "Other"];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: P, marginBottom: 4 }}>Document Library</div>
      <div style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>Sales resources & collateral</div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading...</div>}
      {!loading && docs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>No documents available yet.</div>}

      {cats.map(cat => {
        const items = docs.filter(d => d.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1a1a2e" }}>📁 {cat}</div>
            {items.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "white", borderRadius: 12, border: "1px solid rgba(103,58,182,0.08)", marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(103,58,182,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: P }}>
                  {d.file_type || "DOC"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{d.title}</div>
                  {d.description && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{d.description}</div>}
                  {d.product && d.product !== "general" && <div style={{ fontSize: 10, color: P, fontWeight: 600, marginTop: 4, textTransform: "uppercase" }}>{d.product}</div>}
                </div>
                {(d.storage_path || d.external_url) ? (
                  <button onClick={() => open(d)} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(103,58,182,0.08)", color: P, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0 }}>Open ↗</button>
                ) : (
                  <span style={{ fontSize: 11, color: "#ccc" }}>No file</span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
