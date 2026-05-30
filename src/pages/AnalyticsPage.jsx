import { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES, MONTHS_GE } from "../constants";
import CategoryIcon from "../components/CategoryIcon";
import PremiumLock from "../components/PremiumLock";

export default function AnalyticsPage({ transactions, plan, onUpgrade, cur = "₾" }) {
  const now      = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth();

  const [month, setMonth] = useState(curMonth);
  const [tab,   setTab]   = useState("expense"); // "expense" | "income"

  const isPremium  = plan !== "free";
  const monthKey   = `${curYear}-${String(month + 1).padStart(2, "0")}`;

  const monthExp   = transactions.filter(t => t.date.startsWith(monthKey) && t.amount < 0);
  const monthInc   = transactions.filter(t => t.date.startsWith(monthKey) && t.amount > 0);
  const totalExp   = Math.abs(monthExp.reduce((s, t) => s + t.amount, 0));
  const totalInc   = monthInc.reduce((s, t) => s + t.amount, 0);
  const netSaving  = totalInc - totalExp;

  const daysInMonth = new Date(curYear, month + 1, 0).getDate();
  const today       = curMonth === month ? now.getDate() - 1 : -1;

  // დღიური მონაცემები
  function dailyAmounts(txList) {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
      return Math.abs(txList.filter(t => t.date === day).reduce((s, t) => s + t.amount, 0));
    });
  }
  const dailyExp = dailyAmounts(monthExp);
  const dailyInc = dailyAmounts(monthInc);
  const maxDailyExp = Math.max(...dailyExp, 1);
  const maxDailyInc = Math.max(...dailyInc, 1);

  // კატეგორიები
  function byCategoryData(txList, cats, total) {
    return cats.map(cat => {
      const sum = Math.abs(txList.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0));
      return { ...cat, sum, pct: total ? Math.round((sum / total) * 100) : 0 };
    }).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum);
  }
  const byCatExp = byCategoryData(monthExp, CATEGORIES,        totalExp);
  const byCatInc = byCategoryData(monthInc, INCOME_CATEGORIES, totalInc);

  // 5-თვიანი ტრენდი
  function trendData(isExpense) {
    return Array.from({ length: 5 }, (_, i) => {
      const d   = new Date(curYear, month - 4 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sum = Math.abs(
        transactions
          .filter(t => t.date.startsWith(key) && (isExpense ? t.amount < 0 : t.amount > 0))
          .reduce((s, t) => s + t.amount, 0)
      );
      return { label: MONTHS_GE[d.getMonth()].slice(0, 3), sum };
    });
  }
  const trendExp = trendData(true);
  const trendInc = trendData(false);
  const maxTExp  = Math.max(...trendExp.map(t => t.sum), 1);
  const maxTInc  = Math.max(...trendInc.map(t => t.sum), 1);

  const isExp   = tab === "expense";
  const accent  = isExp ? "#E05470" : "#4CAF82";
  const total   = isExp ? totalExp   : totalInc;
  const daily   = isExp ? dailyExp   : dailyInc;
  const maxDail = isExp ? maxDailyExp : maxDailyInc;
  const byCat   = isExp ? byCatExp   : byCatInc;
  const trend   = isExp ? trendExp   : trendInc;
  const maxT    = isExp ? maxTExp    : maxTInc;
  const label   = isExp ? "გასავალი" : "შემოსავალი";

  return (
    <div style={{ padding: "20px 16px 100px" }}>

      {/* Month selector */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {MONTHS_GE.slice(0, curMonth + 1).map((m, i) => (
          <button key={i} onClick={() => setMonth(i)} style={{
            padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0,
            background: month === i ? "#4CAF82" : "#1a2e22",
            color: month === i ? "#fff" : "rgba(255,255,255,0.5)",
            fontWeight: month === i ? 700 : 400, fontSize: 13, fontFamily: "inherit"
          }}>{m}</button>
        ))}
      </div>

      {/* Expense / Income tab */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4, marginBottom: 20 }}>
        {[["expense","↓ გასავალი"], ["income","↑ შემოსავალი"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            flex: 1, padding: "10px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: tab === v
              ? (v === "expense" ? "linear-gradient(135deg,#E05470,#b03050)" : "linear-gradient(135deg,#4CAF82,#2d8f5a)")
              : "transparent",
            color: tab === v ? "#fff" : "rgba(255,255,255,0.45)",
            fontWeight: 700, fontSize: 13
          }}>{l}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "შემოსავალი", val: totalInc, col: "#4CAF82", icon: "↑" },
          { label: "გასავალი",   val: totalExp, col: "#E05470", icon: "↓" },
          { label: netSaving >= 0 ? "დაზოგილი" : "დეფიციტი",
            val: Math.abs(netSaving), col: netSaving >= 0 ? "#A78BFA" : "#F59E0B",
            icon: netSaving >= 0 ? "💰" : "⚠️" },
        ].map(c => (
          <div key={c.label} style={{ background: "#1a2e22", borderRadius: 14, padding: "12px 10px",
            border: `1px solid ${c.col}22` }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{c.icon} {c.label}</p>
            <p style={{ color: c.col, fontWeight: 800, fontSize: 15 }}>
              {c.val.toLocaleString()} {cur}
            </p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        background: isExp
          ? "linear-gradient(135deg,#2a1a1f,#1a0d12)"
          : "linear-gradient(135deg,#1a3a2a,#0d2419)",
        borderRadius: 20, padding: "20px", marginBottom: 20,
        border: `1px solid ${accent}22`
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 4 }}>
          სულ {label} · {MONTHS_GE[month]}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{total.toLocaleString()}</span>
          <span style={{ fontSize: 20, color: accent, fontWeight: 700 }}>{cur}</span>
        </div>
        {total === 0 && (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 6 }}>
            ამ თვეში {label} არ არის
          </p>
        )}
      </div>

      {/* Daily bar chart */}
      <div style={{ background: "#1a2e22", borderRadius: 20, padding: "20px", marginBottom: 20,
        border: "1px solid rgba(76,175,82,0.1)" }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          დღიური {label}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
          {daily.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                height: `${Math.max((d / maxDail) * 72, d > 0 ? 4 : 1)}px`,
                background: i === today
                  ? accent
                  : d > 0
                    ? accent + "88"
                    : accent + "18"
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {["1", "7", "14", "21", String(daysInMonth)].map(d => (
            <span key={d} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Trend — PRO */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <div style={{
          background: "#1a2e22", borderRadius: 20, padding: "20px",
          border: "1px solid rgba(255,255,255,0.05)",
          filter: isPremium ? "none" : "blur(3px)",
          pointerEvents: isPremium ? "auto" : "none"
        }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            📈 ტრენდი — {label} (5 თვე)
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 80 }}>
            {trend.map((t, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>
                  {t.sum > 0 ? t.sum.toFixed(0) : ""}
                </span>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${Math.max((t.sum / maxT) * 60, t.sum > 0 ? 4 : 2)}px`,
                  background: i === 4 ? accent : accent + "44"
                }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{t.label}</span>
              </div>
            ))}
          </div>
          {trend[4].sum > 0 && trend[3].sum > 0 && (
            <p style={{ color: `${accent}bb`, fontSize: 11, marginTop: 10 }}>
              {trend[4].sum > trend[3].sum ? "↑" : "↓"} {label}{" "}
              {Math.abs(Math.round(((trend[4].sum - trend[3].sum) / trend[3].sum) * 100))}%-ით{" "}
              {trend[4].sum > trend[3].sum ? "გაიზარდა" : "შემცირდა"} წინა თვეზე
            </p>
          )}
        </div>
        {!isPremium && <PremiumLock plan="Pro" onUpgrade={onUpgrade} />}
      </div>

      {/* Categories */}
      {byCat.length > 0 ? (
        <>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            კატეგორიები
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {byCat.map(cat => (
              <div key={cat.id} style={{ background: "#1a2e22", borderRadius: 16, padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CategoryIcon cat={cat.id} size={34} />
                    <div>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{cat.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{cat.pct}%</p>
                    </div>
                  </div>
                  <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>
                    {isExp ? "-" : "+"}{cat.sum.toLocaleString()} {cur}
                  </span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 5 }}>
                  <div style={{ width: `${cat.pct}%`, height: "100%", background: cat.color, borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          😴 {MONTHS_GE[month]}-ში {label} არ გაქვს
        </div>
      )}
    </div>
  );
}
