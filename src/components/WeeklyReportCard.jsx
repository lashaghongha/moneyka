import { useState } from "react";
import { CATEGORIES } from "../constants";

const DAYS_GE    = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
const MONTHS_SH  = ["იანვ","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

// ── helpers ──────────────────────────────────────────────────────────────────

function getWeekRange(offsetWeeks = 0) {
  const now  = new Date();
  const dow  = now.getDay() === 0 ? 6 : now.getDay() - 1;   // Mon = 0
  const mon  = new Date(now);
  mon.setDate(now.getDate() - dow - offsetWeeks * 7);
  const sun  = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start:     mon.toISOString().split("T")[0],
    end:       sun.toISOString().split("T")[0],
    monDate:   new Date(mon),
    sunDate:   new Date(sun),
  };
}

function weekExpenses(transactions, week) {
  return transactions.filter(
    t => t.date >= week.start && t.date <= week.end && t.amount < 0
  );
}

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS_SH[d.getMonth()]}`;
}

// ── mini bar ──────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }) {
  const w = max > 0 ? `${Math.max((value / max) * 100, 3)}%` : "3%";
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 4 }}>
      <div style={{ width: w, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function WeeklyReportCard({ transactions, cur = "₾", onNavigate }) {
  const [open, setOpen] = useState(true);

  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(1);

  const thisExp   = weekExpenses(transactions, thisWeek);
  const lastExp   = weekExpenses(transactions, lastWeek);
  const thisTotal = thisExp.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastTotal = lastExp.reduce((s, t) => s + Math.abs(t.amount), 0);

  // კვირაში ჩანაწერი არ არის — კარტი არ ჩანს
  if (thisTotal === 0) return null;

  // % vs last week
  const diff    = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : null;
  const diffPos = diff !== null && diff > 0;

  // Top 3 კატეგ.
  const byCat = CATEGORIES
    .map(cat => ({
      ...cat,
      sum: thisExp.filter(t => t.category === cat.id)
                  .reduce((s, t) => s + Math.abs(t.amount), 0),
    }))
    .filter(c => c.sum > 0)
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 3);

  const maxSum = byCat[0]?.sum || 1;

  // ყველაზე ძვირი დღე
  const dayRows = DAYS_GE.map((label, i) => {
    const d   = new Date(thisWeek.monDate);
    d.setDate(thisWeek.monDate.getDate() + i);
    const ds  = d.toISOString().split("T")[0];
    const sum = thisExp.filter(t => t.date === ds).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { label, sum };
  });
  const busiest = dayRows.reduce((a, b) => b.sum > a.sum ? b : a, dayRows[0]);

  // Day-by-day mini spark
  const dayMax = Math.max(...dayRows.map(d => d.sum), 1);

  return (
    <div style={{
      background: "linear-gradient(135deg,#1a2e22,#0d1f16)",
      borderRadius: 20, border: "1px solid rgba(76,175,82,0.15)",
      overflow: "hidden", marginTop: 16
    }}>

      {/* ── header (always visible, toggles body) ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", cursor: "pointer"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(76,175,82,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>📊</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>კვირის ანგარიში</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
              {fmtDate(thisWeek.monDate)} – {fmtDate(thisWeek.sunDate)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {diff !== null && (
            <span style={{
              background: diffPos ? "rgba(224,84,112,0.15)" : "rgba(76,175,82,0.15)",
              color: diffPos ? "#E05470" : "#4CAF82",
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8
            }}>
              {diffPos ? "↑" : "↓"}{Math.abs(diff)}%
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, lineHeight: 1 }}>
            {open ? "∨" : "›"}
          </span>
        </div>
      </div>

      {open && (
        <>
          {/* ── this week vs last ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>
            {[
              { label: "ამ კვირა",     val: thisTotal, col: "#E05470",            bg: "rgba(224,84,112,0.08)",  border: "rgba(224,84,112,0.15)" },
              { label: "გასული კვირა", val: lastTotal,  col: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.06)" },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: "12px", border: `1px solid ${c.border}` }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: "0 0 4px" }}>↓ {c.label}</p>
                <p style={{ color: c.col, fontWeight: 800, fontSize: 18, margin: 0 }}>
                  {c.val > 0 ? `${c.val.toFixed(0)} ${cur}` : "—"}
                </p>
              </div>
            ))}
          </div>

          {/* ── day spark bars ── */}
          <div style={{ padding: "0 16px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 48 }}>
              {dayRows.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{
                    width: "100%", borderRadius: "3px 3px 0 0",
                    height: `${Math.max((d.sum / dayMax) * 40, d.sum > 0 ? 4 : 2)}px`,
                    background: d.label === busiest.label && d.sum > 0
                      ? "#E05470cc"
                      : d.sum > 0 ? "rgba(76,175,82,0.5)" : "rgba(255,255,255,0.07)"
                  }} />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── top categories ── */}
          {byCat.length > 0 && (
            <div style={{ padding: "0 16px 14px" }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ტოპ კატეგორიები
              </p>
              {byCat.map(cat => (
                <div key={cat.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>
                      {cat.sum.toFixed(0)} {cur}
                    </span>
                  </div>
                  <MiniBar value={cat.sum} max={maxSum} color={cat.color} />
                </div>
              ))}
            </div>
          )}

          {/* ── footer ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)"
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
              {busiest.sum > 0
                ? <>📅 ყველაზე ძვირი: <strong style={{ color: "#fff" }}>{busiest.label}</strong> · {busiest.sum.toFixed(0)} {cur}</>
                : "📅 ამ კვირა ჩანაწერები არ გაქვს"
              }
            </p>
            <button
              onClick={e => { e.stopPropagation(); onNavigate?.("analytics"); }}
              style={{
                background: "none", border: "none", color: "#4CAF82",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", padding: 0, flexShrink: 0
              }}
            >
              სრული →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
