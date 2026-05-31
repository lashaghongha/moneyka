import { useState } from "react";
import CategoryIcon from "./CategoryIcon";

export default function TxRow({ tx, cur = "₾", onDelete, onEdit }) {
  const [confirm, setConfirm] = useState(false);
  const isExp = tx.amount < 0;

  if (confirm) {
    return (
      <div style={{
        background: "rgba(224,84,112,0.12)", borderRadius: 16, padding: "12px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: "1px solid rgba(224,84,112,0.3)"
      }}>
        <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>წაშალოთ "{tx.desc}"?</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setConfirm(false)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            padding: "7px 14px", color: "rgba(255,255,255,0.6)", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit"
          }}>გაუქმება</button>
          <button onClick={() => onDelete?.(tx.id)} style={{
            background: "#E05470", border: "none", borderRadius: 10,
            padding: "7px 14px", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit"
          }}>წაშლა</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#1a2e22", borderRadius: 16, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      border: "1px solid rgba(255,255,255,0.04)"
    }}>
      <CategoryIcon cat={tx.category} size={38} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{tx.desc}</p>
          {tx.recurring && (
            <span style={{ background: "rgba(167,139,250,0.2)", color: "#A78BFA",
              fontSize: 9, padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>
              🔁
            </span>
          )}
        </div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
          {tx.time} · {tx.date}
        </p>
      </div>
      <span style={{ color: isExp ? "#E05470" : "#4CAF82", fontWeight: 700, fontSize: 15 }}>
        {isExp ? "-" : "+"}{Math.abs(tx.amount).toLocaleString()} {tx.currency || cur}
      </span>
      {/* action buttons */}
      {(onDelete || onEdit) && (
        <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
          {onDelete && (
            <button onClick={() => setConfirm(true)} style={{
              background: "rgba(224,84,112,0.12)", border: "none", borderRadius: 8,
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14, color: "#E05470"
            }}>🗑</button>
          )}
        </div>
      )}
    </div>
  );
}
