import { useState } from "react";
import { SUB_CATEGORIES } from "../constants";
import PremiumLock from "../components/PremiumLock";

const INITIAL_SUBSCRIPTIONS_PREVIEW = [
  { id: 1, name: "Spotify",          icon: "🎵", color: "#1DB954", price: 8.99,  billing: "monthly" },
  { id: 2, name: "YouTube Premium",  icon: "▶️", color: "#FF0000", price: 13.99, billing: "monthly" },
  { id: 3, name: "Netflix",          icon: "🎬", color: "#E50914", price: 15.99, billing: "monthly" },
  { id: 4, name: "iCloud+",          icon: "☁️", color: "#4A90D9", price: 2.99,  billing: "monthly" },
];

const PRESET_SUBS = [
  { name: "Spotify",         icon: "🎵", color: "#1DB954", price: 8.99,  category: "მუსიკა"      },
  { name: "YouTube Premium", icon: "▶️", color: "#FF0000", price: 13.99, category: "ვიდეო"       },
  { name: "Netflix",         icon: "🎬", color: "#E50914", price: 15.99, category: "ვიდეო"       },
  { name: "Apple Music",     icon: "🎵", color: "#FC3C44", price: 5.99,  category: "მუსიკა"      },
  { name: "iCloud+",         icon: "☁️", color: "#4A90D9", price: 2.99,  category: "ღრუბელი"     },
  { name: "Google One",      icon: "🗂️", color: "#4285F4", price: 2.99,  category: "ღრუბელი"     },
  { name: "Disney+",         icon: "✨", color: "#113CCF", price: 8.99,  category: "ვიდეო"       },
  { name: "Xbox Game Pass",  icon: "🎮", color: "#107C10", price: 14.99, category: "თამაშები"    },
  { name: "Adobe CC",        icon: "🎨", color: "#FF0000", price: 29.99, category: "შემოქმედება" },
  { name: "Duolingo Plus",   icon: "🦉", color: "#58CC02", price: 6.99,  category: "განათლება"   },
  { name: "სხვა",            icon: "📦", color: "#95A5A6", price: 0,     category: "სხვა"        },
];

export default function SubscriptionsPage({ isPremium, onUpgrade, subs, setSubs, cur = "₾" }) {
  const [catFilter, setCatFilter] = useState("ყველა");
  const [showAdd, setShowAdd]     = useState(false);
  const [newSub, setNewSub]       = useState({ name: "", icon: "📱", color: "#4CAF82", price: "", billing: "monthly", category: "სხვა", nextDate: "" });

  const active       = subs.filter(s => s.active);
  const inactive     = subs.filter(s => !s.active);
  const monthlyTotal = active.reduce((sum, s) => sum + (s.billing === "yearly" ? s.price / 12 : s.price), 0);
  const yearlyTotal  = monthlyTotal * 12;
  const filtered     = catFilter === "ყველა" ? active : active.filter(s => s.category === catFilter);
  const upcoming     = [...active].sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 3);

  function toggleSub(id) { setSubs(s => s.map(x => x.id === id ? { ...x, active: !x.active } : x)); }
  function deleteSub(id)  { setSubs(s => s.filter(x => x.id !== id)); }

  function addSub() {
    if (!newSub.name || !newSub.price) return;
    setSubs(s => [...s, {
      ...newSub, id: Date.now(),
      price: parseFloat(newSub.price), active: true,
      nextDate: newSub.nextDate || new Date().toISOString().split("T")[0]
    }]);
    setNewSub({ name: "", icon: "📱", color: "#4CAF82", price: "", billing: "monthly", category: "სხვა", nextDate: "" });
    setShowAdd(false);
  }

  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 320 }}>
        <div style={{ filter: "blur(3px)", pointerEvents: "none", background: "#1a2e22", padding: "20px", borderRadius: 20 }}>
          <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>💳 გამოწერების მართვა</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>სულ: 71.95 ₾/თვე</p>
          {INITIAL_SUBSCRIPTIONS_PREVIEW.map(s => (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 14px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "33",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600 }}>{s.name}</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>ყოველთვიური</p>
              </div>
              <span style={{ color: "#E05470", fontWeight: 700 }}>{s.price} ₾</span>
            </div>
          ))}
        </div>
        <PremiumLock plan="Pro" onUpgrade={onUpgrade} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "linear-gradient(135deg,#1a0d3a,#0d0d2e)", borderRadius: 18, padding: "16px", border: "1px solid rgba(167,139,250,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>ყოველთვიური</p>
          <p style={{ color: "#A78BFA", fontWeight: 800, fontSize: 24 }}>{monthlyTotal.toFixed(2)}₾</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{active.length} გამოწერა</p>
        </div>
        <div style={{ background: "linear-gradient(135deg,#1a2a0e,#0d1a0a)", borderRadius: 18, padding: "16px", border: "1px solid rgba(76,175,82,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>წლიური ჯამი</p>
          <p style={{ color: "#4CAF82", fontWeight: 800, fontSize: 24 }}>{yearlyTotal.toFixed(0)}₾</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>ყოველ წელს</p>
        </div>
      </div>

      {/* Upcoming */}
      <div style={{ background: "#1a2e22", borderRadius: 18, padding: "16px", marginBottom: 20, border: "1px solid rgba(245,158,11,0.15)" }}>
        <p style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📅 მომდევნო გადასახდელები</p>
        {upcoming.map(s => {
          const days = Math.ceil((new Date(s.nextDate) - new Date(new Date().toISOString().split("T")[0])) / 86400000);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{s.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{s.price.toFixed(2)} ₾</p>
                <p style={{ color: days <= 3 ? "#E05470" : "rgba(255,255,255,0.35)", fontSize: 10 }}>
                  {days <= 0 ? "დღეს!" : days === 1 ? "ხვალ" : `${days} დღეში`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <button onClick={() => setShowAdd(v => !v)} style={{
        width: "100%", background: "linear-gradient(135deg,#1a0d3a,#0d0d2e)",
        border: "2px dashed rgba(167,139,250,0.4)", borderRadius: 18, padding: "14px",
        cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <span style={{ color: "#A78BFA", fontSize: 18 }}>{showAdd ? "✕" : "+"}</span>
        <span style={{ color: "#A78BFA", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>
          {showAdd ? "დახურვა" : "ახალი გამოწერის დამატება"}
        </span>
      </button>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "#1a2e22", borderRadius: 20, padding: "18px", marginBottom: 20, border: "1px solid rgba(167,139,250,0.25)" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>სწრაფი დამატება</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {PRESET_SUBS.map(p => (
              <button key={p.name} onClick={() => setNewSub(n => ({ ...n, name: p.name, icon: p.icon, color: p.color, price: String(p.price), category: p.category }))}
                style={{
                  background: newSub.name === p.name ? p.color + "33" : "rgba(255,255,255,0.05)",
                  border: newSub.name === p.name ? `1.5px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                }}>
                <span style={{ fontSize: 14 }}>{p.icon}</span>
                <span style={{ color: newSub.name === p.name ? p.color : "rgba(255,255,255,0.55)", fontSize: 12, fontFamily: "inherit" }}>{p.name}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, display: "block", marginBottom: 4 }}>სახელი</label>
              <input value={newSub.name} onChange={e => setNewSub(n => ({ ...n, name: e.target.value }))}
                placeholder="მაგ. Spotify"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, display: "block", marginBottom: 4 }}>ფასი (₾/თვე)</label>
              <input value={newSub.price} onChange={e => setNewSub(n => ({ ...n, price: e.target.value }))}
                type="number" placeholder="8.99"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, display: "block", marginBottom: 4 }}>პერიოდი</label>
              <select value={newSub.billing} onChange={e => setNewSub(n => ({ ...n, billing: e.target.value }))}
                style={{ width: "100%", background: "#0d1a0a", border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                <option value="monthly">ყოველთვიური</option>
                <option value="yearly">ყოველწლიური</option>
              </select>
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, display: "block", marginBottom: 4 }}>გადახდის თარიღი</label>
              <input value={newSub.nextDate} onChange={e => setNewSub(n => ({ ...n, nextDate: e.target.value }))}
                type="date"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 12, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>გაუქმება</button>
            <button onClick={addSub} style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>შენახვა</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {SUB_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
            background: catFilter === c ? "#A78BFA" : "#1a2e22",
            color: catFilter === c ? "#fff" : "rgba(255,255,255,0.45)", fontWeight: catFilter === c ? 700 : 400, fontSize: 12
          }}>{c}</button>
        ))}
      </div>

      {/* Active subs */}
      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, marginBottom: 10 }}>აქტიური · {active.length}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {filtered.map(s => {
          const monthlyPrice = s.billing === "yearly" ? s.price / 12 : s.price;
          const today        = new Date(new Date().toISOString().split("T")[0]);
          const days         = Math.ceil((new Date(s.nextDate) - today) / 86400000);
          const nd           = new Date(s.nextDate);
          const dateLabel    = `${nd.getDate()} ${["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"][nd.getMonth()]}`;
          return (
            <div key={s.id} style={{ background: "#1a2e22", borderRadius: 18, padding: "14px 16px", border: `1px solid ${s.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: s.color + "22",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
                  border: `1.5px solid ${s.color}44` }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{s.name}</p>
                    <span style={{ background: s.billing === "yearly" ? "rgba(76,175,82,0.15)" : "rgba(167,139,250,0.12)",
                      color: s.billing === "yearly" ? "#4CAF82" : "#A78BFA",
                      fontSize: 9, padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>
                      {s.billing === "yearly" ? "წლიური" : "თვიური"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.category}</span>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>·</span>
                    <span style={{ color: days <= 3 ? "#E05470" : "rgba(255,255,255,0.3)", fontSize: 11 }}>
                      {dateLabel} · {days <= 0 ? "დღეს!" : days === 1 ? "ხვალ" : `${days} დღეში`}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: s.color, fontWeight: 800, fontSize: 17 }}>{monthlyPrice.toFixed(2)}₾</p>
                  {s.billing === "yearly" && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{s.price.toFixed(2)}₾/წ</p>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => toggleSub(s.id)} style={{ background: "rgba(224,84,112,0.12)", border: "1px solid rgba(224,84,112,0.2)", borderRadius: 8, padding: "3px 8px", color: "#E05470", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>pause</button>
                    <button onClick={() => deleteSub(s.id)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "3px 8px", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paused */}
      {inactive.length > 0 && (
        <>
          <p style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 13, marginBottom: 10 }}>pause · {inactive.length}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {inactive.map(s => (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: s.color + "15",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, filter: "grayscale(0.5)" }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>{s.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{s.category}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{s.price.toFixed(2)}₾</p>
                  <button onClick={() => toggleSub(s.id)} style={{ background: "rgba(76,175,82,0.12)", border: "1px solid rgba(76,175,82,0.2)",
                    borderRadius: 8, padding: "3px 8px", color: "#4CAF82", fontSize: 10, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                    გააქტიურება
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category breakdown */}
      <div style={{ marginTop: 24, background: "linear-gradient(135deg,#1a0d3a,#0d0d2e)", borderRadius: 20, padding: "18px", border: "1px solid rgba(167,139,250,0.15)" }}>
        <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📊 კატეგორიით</p>
        {Object.entries(
          active.reduce((acc, s) => {
            const m = s.billing === "yearly" ? s.price / 12 : s.price;
            acc[s.category] = (acc[s.category] || 0) + m;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
          const pct = Math.round((total / monthlyTotal) * 100);
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{cat}</span>
                <span style={{ color: "#A78BFA", fontWeight: 600, fontSize: 13 }}>{total.toFixed(2)}₾ · {pct}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#A78BFA", borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
