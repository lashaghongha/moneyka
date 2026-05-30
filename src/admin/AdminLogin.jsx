import { useState } from "react";
import { adminLogin } from "./adminApi";

export default function AdminLogin({ onLogin }) {
  const [key,  setKey]  = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await adminLogin(key);
      localStorage.setItem("mk_admin_key", key);
      onLogin();
    } catch {
      setErr("გასაღები არასწორია ან Backend გათიშულია");
    }
    setBusy(false);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: "#0d1a11",
      fontFamily: "'BPG Nino Mkhedruli','Sylfaen',Georgia,serif", color: "#fff"
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>MoneyKa Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 14 }}>ადმინ პანელი</p>
        </div>

        <div style={{
          background: "#1a2e22", borderRadius: 16, padding: "24px",
          border: "1px solid rgba(76,175,82,0.15)"
        }}>
          <form onSubmit={submit}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 6 }}>
              Admin Key
            </label>
            <input
              type="password" value={key} onChange={e => setKey(e.target.value)}
              placeholder="••••••••••••••" autoFocus
              style={{
                width: "100%", background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(76,175,82,0.3)", borderRadius: 12,
                padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none",
                marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
            {err && <p style={{ color: "#E05470", fontSize: 13, marginBottom: 12 }}>⚠️ {err}</p>}
            <button type="submit" disabled={busy} style={{
              width: "100%", background: "linear-gradient(135deg,#4CAF82,#2d8f5a)",
              border: "none", borderRadius: 12, padding: "14px", color: "#fff",
              fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
              opacity: busy ? 0.7 : 1
            }}>
              {busy ? "⏳ ..." : "შესვლა →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 14 }}>
          default key: moneykaadmin2024
        </p>
      </div>
    </div>
  );
}
