import { useState } from "react";
import { CATEGORIES } from "../constants";
import { storage } from "../storage";
import PremiumLock from "../components/PremiumLock";

const PRESETS = {
  "50/30/20": {
    food: 15, transport: 8, car: 5, fuel: 5,
    entertainment: 10, health: 5, clothes: 5,
    utilities: 10, education: 5, other: 2,
  },
  "სიძუნწე": {
    food: 20, transport: 5, car: 3, fuel: 4,
    entertainment: 3, health: 3, clothes: 2,
    utilities: 8, education: 3, other: 2,
  },
};

const PERIODS = [
  { id: "week",      label: "კვირა",    days: 7  },
  { id: "halfmonth", label: "2 კვირა",  days: 14 },
  { id: "month",     label: "თვე",      days: null }, // calendar month
];

// სკალირების კოეფიციენტი — budgets ინახება "თვიურ" ეკვივალენტში
// week × 1  → month: ÷ 4  |  halfmonth: ÷ 2  |  month: ÷ 1
const PERIOD_DIVISOR = { week: 4, halfmonth: 2, month: 1 };

function getPersistedBase() {
  try { return JSON.parse(localStorage.getItem("mk_budget_base") || "{}"); }
  catch { return {}; }
}
function savePersistedBase(obj) {
  localStorage.setItem("mk_budget_base", JSON.stringify(obj));
}

export default function BudgetPage({ transactions, goals = [], isPremium, onUpgrade, cur = "₾" }) {
  const [budgets,     setBudgets]     = useState(() => storage.getBudgets());
  const [goalBudgets, setGoalBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mk_goal_budgets") || "{}"); } catch { return {}; }
  });
  const [editing,  setEditing]  = useState(null);
  const [inputVal, setInputVal] = useState("");

  // period: "week" | "halfmonth" | "month"
  const [period,   setPeriod]   = useState(() =>
    localStorage.getItem("mk_budget_period") || "month"
  );
  // baseSrc: "balance" | "income" | "custom"
  const [baseSrc,  setBaseSrc]  = useState(() =>
    getPersistedBase().src || "balance"
  );
  const [customAmt, setCustomAmt] = useState(() =>
    getPersistedBase().custom || ""
  );
  const [editingBase, setEditingBase] = useState(false);
  const [baseInput,   setBaseInput]   = useState("");

  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 260 }}>
        <div style={{ filter: "blur(3px)", pointerEvents: "none", background: "#1a2e22", padding: "20px", borderRadius: 20 }}>
          <p style={{ color: "#4CAF82", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📊 ბიუჯეტის დაგეგმვა</p>
          {[["საკვები","500₾","64%"], ["კომუნალური","200₾","80%"], ["გართობა","150₾","40%"]].map(([l,b,p],i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{l}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{b}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
                <div style={{ width: p, height: "100%", background: "#4CAF82", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
        <PremiumLock plan="Pro" onUpgrade={onUpgrade} />
      </div>
    </div>
  );

  // ── Period date range ──────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let periodStart;
  const periodDef = PERIODS.find(p => p.id === period);
  if (periodDef.days) {
    periodStart = new Date(now - periodDef.days * 86400000).toISOString().split("T")[0];
  } else {
    // calendar month
    periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const periodTx = transactions.filter(t => t.date >= periodStart && t.date <= todayStr && t.amount < 0);

  const spent = {};
  periodTx.forEach(t => {
    spent[t.category] = (spent[t.category] || 0) + Math.abs(t.amount);
  });
  const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0);

  // ── Period divisor ─────────────────────────────────────────────────────────
  const periodDiv = PERIOD_DIVISOR[period] || 1;

  // ── Budget base ────────────────────────────────────────────────────────────
  const accountBalance = transactions.reduce((s, t) => s + t.amount, 0);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthIncome = transactions
    .filter(t => t.date?.startsWith(monthKey) && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const planningBase =
    baseSrc === "balance" ? Math.max(accountBalance, 0) :
    baseSrc === "income"  ? monthIncome :
    parseFloat(customAmt) || 0;

  // period-scaled base — ეს გამოიყენება display-სა და unallocated-ისთვის
  const scaledBase = planningBase / periodDiv;

  function switchBase(src) {
    setBaseSrc(src);
    savePersistedBase({ src, custom: customAmt });
  }
  function saveCustomBase(val) {
    document.activeElement?.blur();
    const v = parseFloat(val) || 0;
    setCustomAmt(String(v));
    setEditingBase(false);
    savePersistedBase({ src: "custom", custom: String(v) });
  }

  // ბიუჯეტი ინახება "თვიური" ეკვივალენტით → display-ზე ÷ periodDiv
  const totalBudget   = Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0) / periodDiv;
  const totalGoalB    = Object.values(goalBudgets).reduce((s, v) => s + (parseFloat(v) || 0), 0) / periodDiv;
  const unallocated   = scaledBase - totalBudget - totalGoalB;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function saveBudget(catId, val) {
    document.activeElement?.blur();
    // მომხმარებელი შეჰყავს period-ის ეკვივალენტი → გარდავქმნით "თვიურ"-ში შესანახად
    const monthly = (parseFloat(val) || 0) * periodDiv;
    const next = { ...budgets, [catId]: monthly };
    setBudgets(next); storage.saveBudgets(next);
    setEditing(null); setInputVal("");
  }
  function saveGoalBudget(goalId, val) {
    document.activeElement?.blur();
    const next = { ...goalBudgets, [goalId]: parseFloat(val) || 0 };
    setGoalBudgets(next);
    localStorage.setItem("mk_goal_budgets", JSON.stringify(next));
    setEditing(null); setInputVal("");
  }
  function applyPreset(name) {
    if (!planningBase) return;
    const pct  = PRESETS[name];
    const next = {};
    Object.entries(pct).forEach(([id, p]) => {
      // Preset ყოველთვიურ ბაზაზე — ინახება "თვიური"-ად
      next[id] = Math.round(planningBase * p / 100);
    });
    setBudgets(next); storage.saveBudgets(next);
  }
  function changePeriod(p) {
    setPeriod(p);
    localStorage.setItem("mk_budget_period", p);
  }

  const MONTHS_GE = ["იანვ","თებ","მარტ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

  // base source labels
  const BASE_OPTS = [
    { id: "balance", label: "ბალანსი", icon: "💳" },
    { id: "income",  label: "შემოსავ.", icon: "↑"  },
    { id: "custom",  label: "სხვა",    icon: "✏️"  },
  ];

  return (
    <div style={{ padding: "16px 16px 100px" }}>

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1a3a2a,#0d2419)", borderRadius: 20,
        padding: "16px", marginBottom: 12, border: "1px solid rgba(76,175,82,0.2)" }}>

        {/* Base source tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {BASE_OPTS.map(opt => (
            <button key={opt.id} onClick={() => { switchBase(opt.id); if (opt.id === "custom") setEditingBase(true); }} style={{
              flex: 1, padding: "6px 4px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "inherit",
              background: baseSrc === opt.id ? "rgba(76,175,82,0.25)" : "rgba(255,255,255,0.06)",
              color:      baseSrc === opt.id ? "#4CAF82"              : "rgba(255,255,255,0.45)",
              fontWeight: baseSrc === opt.id ? 700 : 400, fontSize: 11,
              transition: "all 0.15s"
            }}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Base label + amount */}
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 2px" }}>
          {baseSrc === "balance" ? `💳 ანგარიშის ბალანსი` :
           baseSrc === "income"  ? `↑ ${MONTHS_GE[now.getMonth()]} · შემოსავალი` :
                                   `✏️ დაგეგმილი თანხა`}
        </p>

        {/* Custom amount edit */}
        {baseSrc === "custom" && editingBase ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0 10px" }}>
            <input autoFocus type="number" value={baseInput || customAmt}
              onChange={e => setBaseInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveCustomBase(baseInput || customAmt); }}
              placeholder="0"
              style={{ flex: 1, background: "#0d1f16", border: "1px solid #4CAF8266",
                borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 18,
                outline: "none", fontFamily: "inherit" }} />
            <button onClick={() => saveCustomBase(baseInput || customAmt)} style={{
              background: "#4CAF82", border: "none", borderRadius: 10,
              padding: "8px 14px", color: "#000", fontWeight: 700, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit"
            }}>✓</button>
          </div>
        ) : (
          <p
            onClick={() => { if (baseSrc === "custom") setEditingBase(true); }}
            style={{
              color: "#4CAF82", fontWeight: 800, fontSize: 28, margin: "0 0 12px",
              cursor: baseSrc === "custom" ? "pointer" : "default"
            }}
          >
            {scaledBase > 0 ? scaledBase.toLocaleString(undefined, { maximumFractionDigits: 0 }) + cur : "—"}
            {baseSrc === "custom" && <span style={{ fontSize: 14, marginLeft: 6, opacity: 0.5 }}>✏️</span>}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "დაგეგმილი",  val: totalBudget,                         color: "#A78BFA" },
            { label: "დახარჯული",  val: totalSpent,                          color: "#E05470" },
            { label: "თავისუფ.",   val: Math.max(scaledBase - totalSpent, 0), color: "#4CAF82" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 2px" }}>{label}</p>
              <p style={{ color, fontWeight: 700, fontSize: 14, margin: 0 }}>{val.toFixed(0)}{cur}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Period tabs ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", background: "#1a2e22", borderRadius: 14, padding: 3, marginBottom: 12 }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => changePeriod(p.id)} style={{
            flex: 1, padding: "9px", borderRadius: 11, border: "none", cursor: "pointer",
            background: period === p.id ? "#4CAF82" : "transparent",
            color:      period === p.id ? "#fff"    : "rgba(255,255,255,0.4)",
            fontWeight: period === p.id ? 700 : 400, fontSize: 13, fontFamily: "inherit",
            transition: "all 0.2s"
          }}>{p.label}</button>
        ))}
      </div>

      {/* ── Preset + clear ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {Object.keys(PRESETS).map(name => (
          <button key={name} onClick={() => applyPreset(name)} disabled={!planningBase} style={{
            flex: 1, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
            borderRadius: 12, padding: "9px", fontFamily: "inherit",
            color: planningBase ? "#A78BFA" : "rgba(255,255,255,0.2)",
            fontWeight: 600, fontSize: 12, cursor: planningBase ? "pointer" : "default"
          }}>✨ {name}</button>
        ))}
        <button onClick={() => { setBudgets({}); storage.saveBudgets({}); }} style={{
          background: "rgba(224,84,112,0.1)", border: "1px solid rgba(224,84,112,0.2)",
          borderRadius: 12, padding: "9px 14px", color: "#E05470",
          fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit"
        }}>გასუფთ.</button>
      </div>

      {!scaledBase && (
        <div style={{ background: "rgba(245,158,11,0.1)", borderRadius: 14, padding: "12px 16px",
          marginBottom: 12, border: "1px solid rgba(245,158,11,0.2)" }}>
          <p style={{ color: "#F59E0B", fontSize: 13, margin: 0 }}>
            ⚠️ {baseSrc === "custom" ? "\"სხვა\" ვარიანტში შეიყვანე თანხა" :
                 baseSrc === "income"  ? "ამ თვეს შემოსავალი არ გაქვს" :
                 "ანგარიშის ბალანსი 0-ია"}
          </p>
        </div>
      )}

      {/* ── Category rows ────────────────────────────────────────────────── */}
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "4px 0 8px", paddingLeft: 2 }}>
        ხარჯი · {periodDef.label}
        {period !== "month" && ` (ბოლო ${periodDef.days} დღე)`}
        {period === "month" && ` · ${MONTHS_GE[now.getMonth()]}`}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CATEGORIES.map(cat => {
          // localStorage-ში "თვიური" ➜ display-ზე period-scaled
          const budget   = (parseFloat(budgets[cat.id]) || 0) / periodDiv;
          const spentAmt = spent[cat.id] || 0;
          const pct      = budget > 0 ? Math.min((spentAmt / budget) * 100, 100) : 0;
          const over     = budget > 0 && spentAmt > budget;
          const barColor = over ? "#E05470" : pct > 80 ? "#F59E0B" : "#4CAF82";
          const editKey  = `cat:${cat.id}`;
          const isEd     = editing === editKey;

          return (
            <div key={cat.id} style={{
              background: "#1a2e22", borderRadius: 16, padding: "14px 16px",
              border: over ? "1px solid rgba(224,84,112,0.3)" : "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: budget > 0 ? 10 : 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: cat.color + "22", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 18, border: `1.5px solid ${cat.color}44`
                }}>{cat.icon}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>{cat.label}</p>
                    {over && <span style={{ color: "#E05470", fontSize: 11, fontWeight: 700 }}>⚠️ გადაჭარბება</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                    {spentAmt.toFixed(2)}{cur}{budget > 0 && ` / ${budget.toFixed(0)}${cur}`}
                  </p>
                </div>

                {!isEd ? (
                  <button onClick={() => { setEditing(editKey); setInputVal(budget > 0 ? String(Math.round(budget)) : ""); }} style={{
                    background: budget > 0 ? cat.color + "22" : "rgba(255,255,255,0.07)",
                    border: `1px solid ${budget > 0 ? cat.color + "44" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit",
                    color: budget > 0 ? cat.color : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600
                  }}>{budget > 0 ? `${budget.toFixed(0)}${cur}` : "+ ლიმიტი"}</button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input autoFocus type="number" value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveBudget(cat.id, inputVal); if (e.key === "Escape") setEditing(null); }}
                      placeholder="0"
                      style={{ width: 72, background: "#0d1f16", border: `1px solid ${cat.color}66`,
                        borderRadius: 8, padding: "6px 8px", color: "#fff", fontSize: 16,
                        outline: "none", fontFamily: "inherit", textAlign: "right" }} />
                    <button onClick={() => saveBudget(cat.id, inputVal)} style={{
                      background: cat.color, border: "none", borderRadius: 8,
                      padding: "6px 10px", color: "#000", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit"
                    }}>✓</button>
                  </div>
                )}
              </div>

              {budget > 0 && (
                <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: barColor, transition: "width 0.4s" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Goals allocation ─────────────────────────────────────────────── */}
      {goals.length > 0 && (
        <>
          <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, margin: "20px 0 10px" }}>
            🎯 მიზნებისთვის გამოყოფა (თვეში)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {goals.map(goal => {
              const monthly   = parseFloat(goalBudgets[goal.id]) || 0;
              const remaining = Math.max(goal.target - goal.saved, 0);
              const months    = monthly > 0 ? Math.ceil(remaining / monthly) : null;
              const pct       = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
              const editKey   = `goal:${goal.id}`;
              const isEd      = editing === editKey;

              return (
                <div key={goal.id} style={{ background: "#1a2e22", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: goal.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `1.5px solid ${goal.color}44` }}>{goal.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>{goal.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                        {goal.saved.toFixed(0)}{cur} / {goal.target.toFixed(0)}{cur}{months && ` · ~${months} თვე`}
                      </p>
                    </div>
                    {!isEd ? (
                      <button onClick={() => { setEditing(editKey); setInputVal(monthly > 0 ? String(monthly) : ""); }} style={{
                        background: monthly > 0 ? goal.color + "22" : "rgba(255,255,255,0.07)",
                        border: `1px solid ${monthly > 0 ? goal.color + "44" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit",
                        color: monthly > 0 ? goal.color : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600
                      }}>{monthly > 0 ? `${monthly.toFixed(0)}${cur}/თვე` : "+ გამოყოფა"}</button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input autoFocus type="number" value={inputVal}
                          onChange={e => setInputVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveGoalBudget(goal.id, inputVal); if (e.key === "Escape") setEditing(null); }}
                          placeholder="0"
                          style={{ width: 72, background: "#0d1f16", border: `1px solid ${goal.color}66`, borderRadius: 8, padding: "6px 8px", color: "#fff", fontSize: 16, outline: "none", fontFamily: "inherit", textAlign: "right" }} />
                        <button onClick={() => saveGoalBudget(goal.id, inputVal)} style={{
                          background: goal.color, border: "none", borderRadius: 8, padding: "6px 10px",
                          color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                        }}>✓</button>
                      </div>
                    )}
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6 }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: goal.color, transition: "width 0.4s" }} />
                  </div>
                  {monthly > 0 && remaining > 0 && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "6px 0 0" }}>
                      დარჩენილია {remaining.toFixed(0)}{cur} · თვეში {monthly.toFixed(0)}{cur} → ~{months} თვე
                    </p>
                  )}
                  {pct >= 100 && <p style={{ color: "#4CAF82", fontSize: 11, fontWeight: 700, margin: "6px 0 0" }}>🎉 მიზანი მიღწეულია!</p>}
                </div>
              );
            })}
          </div>
          {totalGoalB > 0 && (
            <div style={{ marginTop: 8, background: "rgba(76,175,82,0.08)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(76,175,82,0.15)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>🎯 სულ მიზნებისთვის</span>
              <span style={{ color: "#4CAF82", fontWeight: 700, fontSize: 13 }}>{totalGoalB.toFixed(0)}{cur}/თვე</span>
            </div>
          )}
        </>
      )}

      {/* ── Unallocated ──────────────────────────────────────────────────── */}
      {scaledBase > 0 && (
        <div style={{ marginTop: 16, background: "rgba(167,139,250,0.08)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(167,139,250,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0 }}>📦 გაუნაწილებელი</p>
            <p style={{ color: unallocated >= 0 ? "#A78BFA" : "#E05470", fontWeight: 700, fontSize: 14, margin: 0 }}>
              {unallocated >= 0 ? "" : "-"}{Math.abs(unallocated).toFixed(0)}{cur}
            </p>
          </div>
          {unallocated < 0 && (
            <p style={{ color: "rgba(224,84,112,0.7)", fontSize: 11, margin: "4px 0 0" }}>
              ბიუჯეტი ბალანსს {Math.abs(unallocated).toFixed(0)}{cur}-ით აღემატება
            </p>
          )}
        </div>
      )}
    </div>
  );
}
