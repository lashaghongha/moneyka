import { useState } from "react";
import Card from "./Card";
import Badge from "./Badge";
import { timeAgo } from "./adminConstants";

export default function UsersTable({ users, onChangePlan, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const shown = users
    .filter(u => filter === "all" || u.plan === filter)
    .filter(u => !search ||
      u.deviceId.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <Card>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, flex: 1, fontSize: 15 }}>
          👥 მომხმარებლები ({shown.length})
        </p>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 სახელი / Device ID..."
          style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(76,175,82,0.2)",
            borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 13, outline: "none", width: 180,
          }}
        />
        {["all", "free", "pro", "elite"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 14px", borderRadius: 20, border: "none",
            background: filter === f ? "#4CAF82" : "rgba(255,255,255,0.07)",
            color: filter === f ? "#fff" : "rgba(255,255,255,0.5)",
            fontWeight: filter === f ? 700 : 400, fontSize: 13, cursor: "pointer",
          }}>
            {f === "all" ? "ყველა" : f}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {["#", "სახელი", "Device ID", "პლანი", "პირველი შესვლა", "ბოლო აქტ.", "ქმედება"].map(h => (
                <th key={h} style={{
                  padding: "10px 12px", textAlign: "left",
                  color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
                  მომხმარებელი არ მოიძებნა
                </td>
              </tr>
            )}
            {shown.map((u, i) => (
              <tr key={u.id} style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
              }}>
                <td style={{ padding: "12px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{u.id}</td>
                <td style={{ padding: "12px", fontSize: 13, color: u.name ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: u.name ? 600 : 400 }}>
                  {u.name || "—"}
                </td>
                <td style={{
                  padding: "12px", fontFamily: "monospace", fontSize: 12,
                  color: "rgba(255,255,255,0.45)", maxWidth: 140,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }} title={u.deviceId}>{u.deviceId.slice(0, 18)}…</td>
                <td style={{ padding: "12px" }}><Badge plan={u.plan} /></td>
                <td style={{ padding: "12px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  {new Date(u.firstSeen).toLocaleDateString("ka-GE")}
                </td>
                <td style={{ padding: "12px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  {timeAgo(u.lastSeen)}
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={u.plan} onChange={e => onChangePlan(u.id, e.target.value)} style={{
                      background: "#112219", border: "1px solid rgba(76,175,82,0.25)",
                      borderRadius: 8, padding: "5px 8px", color: "#fff", fontSize: 12,
                      outline: "none", cursor: "pointer", colorScheme: "dark",
                    }}>
                      <option value="free"  style={{ background: "#112219", color: "#4CAF82" }}>🆓 free</option>
                      <option value="pro"   style={{ background: "#112219", color: "#A78BFA" }}>⭐ pro</option>
                      <option value="elite" style={{ background: "#112219", color: "#F59E0B" }}>👑 elite</option>
                    </select>
                    <button onClick={() => onDelete(u.id)} style={{
                      background: "rgba(224,84,112,0.12)", border: "1px solid rgba(224,84,112,0.25)",
                      borderRadius: 8, padding: "5px 10px", color: "#E05470", fontSize: 13, cursor: "pointer",
                    }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
