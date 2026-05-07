"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase-browser";

const P = "#673AB6", P2 = "#5E35B1";

export default function AccountView({ profile }) {
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const changePass = async (e) => {
    e?.preventDefault();
    setMsg(""); setErr("");
    if (pass.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) setErr(error.message); else { setMsg("Password updated!"); setPass(""); }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: P, marginBottom: 16 }}>My Account</div>

      <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid rgba(103,58,182,0.08)", marginBottom: 16 }}>
        <Row label="Name" value={profile?.name} />
        <Row label="Email" value={profile?.email} />
        <Row label="Role" value={profile?.role?.replace("_", " ")} />
        <Row label="Member since" value={new Date(profile?.created_at).toLocaleDateString("en-AU")} last />
      </div>

      <form onSubmit={changePass} style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid rgba(103,58,182,0.08)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: P, marginBottom: 12 }}>Change Password</div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} style={inpStyle} />
        {err && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{err}</div>}
        {msg && <div style={{ fontSize: 12, color: "#16A34A", marginTop: 8 }}>{msg}</div>}
        <button type="submit" disabled={loading || !pass} style={{ width: "100%", padding: 12, marginTop: 12, borderRadius: 10, border: "none", background: pass ? `linear-gradient(135deg, ${P}, ${P2})` : "#D4D0DA", color: "white", fontWeight: 700, fontSize: 14, cursor: pass ? "pointer" : "default" }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

const Row = ({ label, value, last }) => (
  <div style={{ padding: "10px 0", borderBottom: last ? "none" : "1px solid rgba(103,58,182,0.06)" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, color: "#1a1a2e", textTransform: label === "Role" ? "capitalize" : "none" }}>{value || "—"}</div>
  </div>
);

const inpStyle = { width: "100%", padding: "10px 14px", border: "2px solid rgba(103,58,182,0.12)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAFD", boxSizing: "border-box" };
