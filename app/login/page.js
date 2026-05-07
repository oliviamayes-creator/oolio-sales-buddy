"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";

const P = "#673AB6", P3 = "#3023AE";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErr(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
    if (error) { setErr(error.message); setLoading(false); return; }
    router.push("/"); router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${P}, ${P3}, #1a0d4e)`, padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: "2px solid rgba(255,255,255,0.2)", fontSize: 28 }}>🟣</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: "white" }}>Oolio Onboard</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Sales Team Platform</div>
        </div>
        <form onSubmit={handleLogin} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px 24px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.name@oolio.com" required autoComplete="email" style={inpStyle} />
          <div style={{ height: 14 }} />
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password" style={inpStyle} />
          {err && <div style={{ fontSize: 12, color: "#FF8A8A", marginTop: 8 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, marginTop: 16, borderRadius: 10, border: "none", background: "white", color: P, fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            New here? <Link href="/signup" style={{ color: "white", fontWeight: 600, textDecoration: "underline" }}>Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inpStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
  color: "white", fontSize: 15, outline: "none",
};
