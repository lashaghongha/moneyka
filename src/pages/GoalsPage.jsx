import { useState } from "react";

export default function GoalsPage({ goals, setGoals, plan, onUpgrade, cur = "₾" }) {
  const [showAdd, setShowAdd]   = useState(false);
  const [newGoal, setNewGoal]   = useState({ title: "", icon: "🎯", target: "", saved: "" });
  // per-goal custom amount inputs: { [goalId]: string }
  const [amounts, setAmounts]   = useState({});

  const isPremium     = plan !== "free";
  const freeGoalLimit = 3;

  function addGoal() {
    if (!newGoal.title || !newGoal.target) return;
    setGoals(g => [...g, {
      id: Date.now(), title: newGoal.title, icon: newGoal.icon,
      target: +newGoal.target, saved: +(newGoal.saved || 0),
      color: ["#4CAF82", "#4A90D9", "#E07B54", "#9B59B6"][Math.floor(Math.random() * 4)]
    }]);
    setNewGoal({ title: "", icon: "🎯", target: "", saved: "" });
    setShowAdd(false);
  }

  function changeAmount(id, delta) {
    const raw = parseFloat((amounts[id] || "").replace(",", ".")) || 0;
    if (raw <= 0) return;
    setGoals(g => g.map(gl => {
      if (gl.id !== id) return gl;
      const next = delta > 0
        ? Math.min(gl.saved + raw, gl.target)
        : Math.max(gl.saved - raw, 0);
      return { ...gl, saved: Math.round(next * 100) / 100 };
    }));
    setAmounts(a => ({ ...a, [id]: "" }));
  }

  const canAdd = isPremium || goals.length < freeGoalLimit;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <button onClick={() => canAdd ? setShowAdd(true) : onUpgrade()} style={{
        width: "100%",
        background: canAdd ? "linear-gradient(135deg,#2d5a3d,#1a3a28)" : "rgba(167,139,250,0.08)",
        border: canAdd ? "2px dashed rgba(76,175,82,0.4)" : "2px dashed rgba(167,139,250,0.4)",
        borderRadius: 18, padding: "16px", cursor: "pointer", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <span style={{ color: canAdd ? "#4CAF82" : "#A78BFA", fontSize: 20 }}>{canAdd ? "+" : "🔒"}</span>
        <span style={{ color: canAdd ? "#4CAF82" : "#A78BFA", fontWeight: 600, fontSize: 15, fontFamily: "inherit" }}>
          {canAdd ? "ახალი მიზანი" : `Pro-ით მეტი მიზანი (${goals.length}/${freeGoalLimit})`}
        </span>
      </button>

      {showAdd && (
        <div style={{ background: "#1a2e22", borderRadius: 20, padding: "20px", marginBottom: 20, border: "1px solid rgba(76,175,82,0.3)" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>ახალი მიზანი</p>
          {[
            { key: "icon",   label: "ემოჯი",              ph: "🎯", type: "text"   },
            { key: "title",  label: "სათაური",            ph: "მაგ. მანქანა", type: "text" },
            { key: "target", label: `სამიზნე თანხა (${cur})`,  ph: "5000", type: "number" },
            { key: "saved",  label: `უკვე დაზოგილი (${cur})`, ph: "0",    type: "number" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
              <input value={newGoal[f.key]} onChange={e => setNewGoal(n => ({ ...n, [f.key]: e.target.value }))}
                placeholder={f.ph} type={f.type}
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(76,175,82,0.2)",
                  borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 15,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setShowAdd(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "12px",
              color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>გაუქმება</button>
            <button onClick={addGoal} style={{ background: "#4CAF82", border: "none", borderRadius: 12, padding: "12px",
              color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>შენახვა</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {goals.map(g => {
          const pct       = Math.min(Math.round((g.saved / g.target) * 100), 100);
          const remaining = g.target - g.saved;
          const amtVal    = amounts[g.id] || "";

          return (
            <div key={g.id} style={{ background: "#1a2e22", borderRadius: 20, padding: "18px", border: "1px solid rgba(76,175,82,0.12)" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: g.color + "22",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {g.icon}
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{g.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
                      {g.saved.toLocaleString()} {cur} / {g.target.toLocaleString()} {cur}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: pct >= 100 ? "#4CAF82" : g.color }}>
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 8, marginBottom: 12 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: g.color,
                  borderRadius: 8, boxShadow: `0 0 8px ${g.color}66`, transition: "width 0.4s" }} />
              </div>

              {/* Completed badge */}
              {pct >= 100 ? (
                <p style={{ textAlign: "center", color: "#4CAF82", fontWeight: 700, fontSize: 13 }}>
                  🎉 მიზანი მიღწეულია!
                </p>
              ) : (
                <>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 10 }}>
                    დარჩა: {remaining.toLocaleString()} {cur}
                  </p>

                  {/* Custom amount row */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Amount input */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        value={amtVal}
                        onChange={e => setAmounts(a => ({ ...a, [g.id]: e.target.value.replace(/[^0-9.,]/g, "") }))}
                        placeholder="თანხა"
                        inputMode="decimal"
                        style={{
                          width: "100%", background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                          padding: "10px 36px 10px 12px", color: "#fff", fontSize: 14,
                          outline: "none", boxSizing: "border-box", fontFamily: "inherit"
                        }}
                      />
                      <span style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        color: "rgba(255,255,255,0.3)", fontSize: 13, pointerEvents: "none"
                      }}>{cur}</span>
                    </div>

                    {/* Subtract button */}
                    <button
                      onClick={() => changeAmount(g.id, -1)}
                      style={{
                        flexShrink: 0, padding: "10px 14px", borderRadius: 12,
                        background: "rgba(224,84,112,0.15)", border: "1px solid rgba(224,84,112,0.35)",
                        color: "#E05470", fontWeight: 700, fontSize: 15,
                        cursor: "pointer", fontFamily: "inherit", lineHeight: 1
                      }}
                    >−</button>

                    {/* Add button */}
                    <button
                      onClick={() => changeAmount(g.id, 1)}
                      style={{
                        flexShrink: 0, padding: "10px 14px", borderRadius: 12,
                        background: g.color + "22", border: `1px solid ${g.color}55`,
                        color: g.color, fontWeight: 700, fontSize: 15,
                        cursor: "pointer", fontFamily: "inherit", lineHeight: 1
                      }}
                    >+</button>
                  </div>

                  {/* Hint labels */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 5 }}>
                    <span style={{ color: "rgba(224,84,112,0.6)", fontSize: 10 }}>გამოკლება</span>
                    <span style={{ color: g.color + "99", fontSize: 10 }}>დამატება</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
