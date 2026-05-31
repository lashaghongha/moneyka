import { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES } from "../constants";
import PremiumLock from "../components/PremiumLock";

const CURRENCIES = [
  { sym: "₾", label: "ლარი",    flag: "🇬🇪" },
  { sym: "$", label: "დოლარი",  flag: "🇺🇸" },
  { sym: "€", label: "ევრო",    flag: "🇪🇺" },
];

export default function AddPage({ onAdd, defaultCat = "food", onClose, plan, cur = "₾" }) {
  const [type,     setType]     = useState("expense");
  const [amount,   setAmount]   = useState("");
  const [cat,      setCat]      = useState(defaultCat);
  const [desc,     setDesc]     = useState("");
  const [txCur,    setTxCur]    = useState(cur);   // per-transaction currency
  const [recurring,  setRecurring]  = useState(false);
  const [recFreq,    setRecFreq]    = useState("monthly");
  const isPremium = plan !== "free";

  function handleTypeSwitch(newType) {
    setType(newType);
    setCat(newType === "expense" ? "food" : "salary");
  }

  const activeCats  = type === "expense" ? CATEGORIES : INCOME_CATEGORIES;
  const accentColor = type === "expense" ? "#E05470" : "#4CAF82";

  function handleSubmit() {
    if (!amount || isNaN(+amount) || +amount <= 0) return;
    const now = new Date();
    const allCats = [...CATEGORIES, ...INCOME_CATEGORIES];
    onAdd({
      id:        Date.now(),
      category:  cat,
      desc:      desc || allCats.find(c => c.id === cat)?.label,
      amount:    type === "expense" ? -Math.abs(+amount) : +Math.abs(+amount),
      date:      now.toISOString().split("T")[0],
      time:      now.toTimeString().slice(0, 5),
      type,
      currency:  txCur,
      recurring: isPremium && recurring,
      recFreq,
    });
    onClose();
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>

      {/* Type toggle */}
      <div style={{ display: "flex", background: "#1a2e22", borderRadius: 16, padding: 4, marginBottom: 20 }}>
        {[["expense", "გასავალი", "#E05470"], ["income", "შემოსავალი", "#4CAF82"]].map(([v, l, c]) => (
          <button key={v} onClick={() => handleTypeSwitch(v)} style={{
            flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
            background: type === v ? c : "transparent",
            color: type === v ? "#fff" : "rgba(255,255,255,0.4)",
            fontWeight: 700, fontSize: 14, fontFamily: "inherit",
            transition: "all 0.2s"
          }}>{l}</button>
        ))}
      </div>

      {/* Amount display */}
      <div style={{
        background: "#1a2e22", borderRadius: 20, padding: "20px 24px 16px",
        textAlign: "center", marginBottom: 14,
        border: `1px solid ${accentColor}22`
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 6px" }}>თანხა</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: accentColor }}>
            {type === "expense" ? "-" : "+"}{amount || "0"}
          </span>
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.5)" }}>{txCur}</span>
        </div>

        {/* Currency selector — inside the amount card */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center" }}>
          {CURRENCIES.map(c => {
            const active = txCur === c.sym;
            return (
              <button key={c.sym} onClick={() => setTxCur(c.sym)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 14px", borderRadius: 20,
                border: active ? `1.5px solid ${accentColor}` : "1px solid rgba(255,255,255,0.12)",
                background: active ? accentColor + "22" : "rgba(255,255,255,0.04)",
                color: active ? accentColor : "rgba(255,255,255,0.4)",
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
              }}>
                <span style={{ fontSize: 14 }}>{c.flag}</span>
                <span>{c.sym}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keypad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
          <button key={k} onClick={() => {
            if (k === "⌫") setAmount(a => a.slice(0, -1));
            else if (k === "." && amount.includes(".")) return;
            else setAmount(a => (a + k).slice(0, 10));
          }} style={{
            background: "#1a2e22", border: "1px solid rgba(76,175,82,0.1)",
            borderRadius: 14, padding: "16px", fontSize: 20, color: "#fff",
            cursor: "pointer", fontWeight: 600, fontFamily: "inherit"
          }}>{k}</button>
        ))}
      </div>

      {/* Description */}
      <input
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="აღწერა (სურვილისამებრ)"
        style={{
          width: "100%", background: "#1a2e22",
          border: "1px solid rgba(76,175,82,0.15)",
          borderRadius: 14, padding: "14px 16px", color: "#fff",
          fontSize: 16, outline: "none", marginBottom: 14,
          boxSizing: "border-box", fontFamily: "inherit"
        }}
      />

      {/* Category picker */}
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 8 }}>
        {type === "expense" ? "ხარჯის კატეგორია" : "შემოსავლის კატეგორია"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {activeCats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            background: cat === c.id ? c.color + "33" : "#1a2e22",
            border: cat === c.id ? `1.5px solid ${c.color}` : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "10px 4px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 0.15s"
          }}>
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <span style={{
              color: cat === c.id ? c.color : "rgba(255,255,255,0.45)",
              fontSize: 9, textAlign: "center", lineHeight: 1.2
            }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Recurring — Pro */}
      <div style={{
        background: "#1a2e22", borderRadius: 16, padding: "14px 16px",
        marginBottom: 20, border: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔁</span>
            <div>
              <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>განმეორებადი ტრანზაქცია</p>
              {!isPremium && <p style={{ color: "rgba(167,139,250,0.7)", fontSize: 11, margin: 0 }}>Pro ფუნქცია</p>}
            </div>
          </div>
          {isPremium ? (
            <div onClick={() => setRecurring(r => !r)} style={{
              width: 44, height: 26, borderRadius: 13, cursor: "pointer",
              background: recurring ? "#4CAF82" : "rgba(255,255,255,0.15)",
              position: "relative", transition: "background 0.2s"
            }}>
              <div style={{
                position: "absolute", top: 3, left: recurring ? 21 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s"
              }} />
            </div>
          ) : (
            <PremiumLock plan="Pro" onUpgrade={() => {}} compact />
          )}
        </div>
        {isPremium && recurring && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[["daily","დღიური"], ["weekly","კვირიური"], ["monthly","თვიური"]].map(([v, l]) => (
              <button key={v} onClick={() => setRecFreq(v)} style={{
                flex: 1, padding: "7px", borderRadius: 10, border: "none",
                cursor: "pointer", fontFamily: "inherit",
                background: recFreq === v ? "#4CAF82" : "rgba(255,255,255,0.07)",
                color: recFreq === v ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: recFreq === v ? 700 : 400
              }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} style={{
        width: "100%",
        background: type === "expense"
          ? "linear-gradient(135deg,#E05470,#b03050)"
          : "linear-gradient(135deg,#4CAF82,#2d8f5a)",
        border: "none", borderRadius: 16, padding: "16px", color: "#fff",
        fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit",
        boxShadow: type === "expense"
          ? "0 8px 24px rgba(224,84,112,0.35)"
          : "0 8px 24px rgba(76,175,82,0.35)",
        transition: "all 0.2s"
      }}>
        {type === "expense" ? "გასავლის შენახვა" : "შემოსავლის შენახვა"}
      </button>
    </div>
  );
}
