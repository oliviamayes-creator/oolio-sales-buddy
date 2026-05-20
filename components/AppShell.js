"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "../lib/supabase-browser";

const P = "#673AB6", P2 = "#5E35B1", P3 = "#3023AE";

export default function AppShell({ profile, children, onLoadSession, onNewChat, activeSessionId }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin" || profile?.role === "owner";
  const isOwner = profile?.role === "owner";
  const isChatPage = pathname === "/";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [ownerView, setOwnerView] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = useCallback(async (q = "") => {
    setLoadingSessions(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (ownerView && isOwner) params.set("all", "true");
      const r = await fetch(`/api/sessions?${params.toString()}`);
      const d = await r.json();
      setSessions(d.sessions || []);
    } catch {}
    setLoadingSessions(false);
  }, [ownerView, isOwner]);

  useEffect(() => {
    if (isChatPage && sidebarOpen) loadSessions(search);
  }, [sidebarOpen, search, ownerView, isChatPage, loadSessions]);

  // Refresh sidebar list when activeSessionId changes (so newly-created session appears in list)
  useEffect(() => {
    if (sidebarOpen && activeSessionId) loadSessions(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "Chat", icon: "💬" },
    { href: "/documents", label: "Docs", icon: "📄" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
    { href: "/account", label: "Account", icon: "👤" },
  ];

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#FAF8FC", overflow: "hidden" }}>
      <header style={{ background: `linear-gradient(135deg, ${P}, ${P3})`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {/* Sidebar toggle - only on chat page */}
        {isChatPage && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Toggle chat history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.25)", fontSize: 16, flexShrink: 0 }}>🟣</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "white" }}>Oolio Onboard</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Hi {profile?.name?.split(" ")[0] || "there"} · {profile?.role === "owner" ? "👑 owner" : profile?.role?.replace("_", " ") || "user"}
          </div>
        </div>
        {isChatPage && onNewChat && (
          <button onClick={() => onNewChat()} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New
          </button>
        )}
        <button onClick={signOut} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer" }}>
          Sign Out
        </button>
      </header>

      {/* Chat history sidebar (overlay on mobile, side-panel on desktop) */}
      {isChatPage && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 30, backdropFilter: "blur(2px)" }} />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: "min(320px, 88vw)",
            background: "white", zIndex: 40,
            display: "flex", flexDirection: "column",
            boxShadow: "2px 0 24px rgba(0,0,0,0.12)",
            animation: "slideIn 0.2s ease",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(103,58,182,0.08)", display: "flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${P}, ${P3})` }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: "white", flex: 1 }}>
                Chat history
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.15)", color: "white", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(103,58,182,0.06)" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search chats..."
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: 10,
                  border: "1.5px solid rgba(103,58,182,0.1)", background: "#FAFAFD",
                  fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
              />
              {isOwner && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#666", cursor: "pointer" }}>
                  <input type="checkbox" checked={ownerView} onChange={e => setOwnerView(e.target.checked)} style={{ accentColor: P }} />
                  👑 Show all users' chats (owner view)
                </label>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {loadingSessions && <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 12 }}>Loading…</div>}
              {!loadingSessions && sessions.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#bbb", fontSize: 12 }}>
                  {search ? "No chats match." : "No chats yet — start one!"}
                </div>
              )}
              {sessions.map(s => (
                <SessionRow
                  key={s.id}
                  session={s}
                  active={s.id === activeSessionId}
                  showUser={ownerView}
                  onClick={() => { onLoadSession?.(s.id); setSidebarOpen(false); }}
                  onDelete={async () => {
                    if (!confirm("Delete this chat? This can't be undone.")) return;
                    await fetch("/api/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
                    loadSessions(search);
                    if (s.id === activeSessionId) onNewChat?.();
                  }}
                />
              ))}
            </div>
          </aside>
        </>
      )}

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      <nav style={{ display: "flex", borderTop: "1px solid rgba(103,58,182,0.06)", background: "white", flexShrink: 0, padding: "6px 0 8px", paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{ flex: 1, padding: "6px 0", color: active ? P : "#999", fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "color 0.15s" }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <style>{`
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

function SessionRow({ session, active, showUser, onClick, onDelete }) {
  const dt = new Date(session.last_message_at || session.created_at);
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  const dateLabel = sameDay
    ? dt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
    : dt.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });

  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: active ? "rgba(103,58,182,0.08)" : "transparent",
        border: active ? "1px solid rgba(103,58,182,0.2)" : "1px solid transparent",
        marginBottom: 4,
        cursor: "pointer",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: 14, color: session.resolved ? "#16A34A" : "#bbb", marginTop: 2, flexShrink: 0 }}>
        {session.resolved ? "✓" : "○"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session.title}
        </div>
        <div style={{ fontSize: 10, color: "#999", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
          {showUser && session.user && <span style={{ color: P, fontWeight: 600 }}>{session.user.name?.split(" ")[0]}</span>}
          <span>{dateLabel}</span>
          <span>·</span>
          <span>{session.message_count || 0} msg</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          width: 22, height: 22, borderRadius: 5, border: "none",
          background: "transparent", color: "#bbb", cursor: "pointer",
          fontSize: 12, opacity: 0.6, flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,50,50,0.08)"; e.currentTarget.style.color = "#DC3232"; e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#bbb"; e.currentTarget.style.opacity = "0.6"; }}
        title="Delete chat"
      >
        🗑
      </button>
    </div>
  );
}
