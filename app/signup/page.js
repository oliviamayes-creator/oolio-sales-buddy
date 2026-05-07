"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";

const P = "#673AB6", P3 = "#3023AE";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e?.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@oolio.com")) {
      setErr("Sign up is restricted to @oolio.com email addresses."); setLoading(false); return;
    }
    if (pass.length < 8) { setErr("Password must be at least 8 characters."); setLoading(false); return; }
    
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: cleanEmail, password: pass,
      options: { data: { name: name.trim() } },
    });
    if (error) { setErr(error.message); setLoading(false); return; }
    setMsg("Account created! You can now log in.");
    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${P}, ${P3}, #1a0d4e)`, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: "2px solid rgba(255,255,255,0.2)", fontSize: 28 }}>🟣</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: "white" }}>Welcome to Oolio</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Create your account</div>
        </div>
        <form onSubmit={handleSignup} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px 24px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Field label="Full name"><input value={name} onChange={e => setName(e.target.value)} required style={inpStyle} placeholder="Jane Smith" /></Field>
          <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inpStyle} placeholder="jane.smith@oolio.com" /></Field>
          <Field label="Password"><input type="password" value={pass} onChange={e => setPass(e.target.value)} required minLength={8} style={inpStyle} placeholder="Min 8 characters" /></Field>
          {err && <div style={{ fontSize: 12, color: "#FF8A8A", marginTop: 8 }}>{err}</div>}
          {msg && <div style={{ fontSize: 12, color: "#86EFAC", marginTop: 8 }}>{msg}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, marginTop: 16, borderRadius: 10, border: "none", background: "white", color: P, fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Creating..." : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Already have an account? <Link href="/login" style={{ color: "white", fontWeight: 600, textDecoration: "underline" }}>Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
const inpStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 15, outline: "none" };
