"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";

const P = "#673AB6", P3 = "#3023AE";

export default function AppShell({ profile, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  };

  const navItems = [
    { href: "/", label: "Chat", icon: "💬" },
    { href: "/documents", label: "Docs", icon: "📄" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
    { href: "/account", label: "Account", icon: "👤" },
  ];

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#FAF8FC", overflow: "hidden" }}>
      <header style={{ background: `linear-gradient(135deg, ${P}, ${P3})`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.25)", fontSize: 16 }}>🟣</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "white" }}>Oolio Onboard</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Hi {profile?.name?.split(" ")[0] || "there"} · {profile?.role?.replace("_", " ") || "user"}
          </div>
        </div>
        <button onClick={signOut} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer" }}>
          Sign Out
        </button>
      </header>

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      <nav style={{ display: "flex", borderTop: "1px solid rgba(103,58,182,0.06)", background: "white", flexShrink: 0, padding: "6px 0 8px", paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{ flex: 1, padding: "8px 0", color: active ? P : "#999", fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
