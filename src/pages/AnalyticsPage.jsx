import { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES, MONTHS_GE } from "../constants";
import CategoryIcon from "../components/CategoryIcon";
import PremiumLock from "../components/PremiumLock";

const DAYS_GE = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

// ── Donut ring chart (SVG) ────────────────────────────────────────────────────
function DonutChart({ data, total, accent, cur, size = 200 }) {
  const r    = 76;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  let off    = 0;

  const segs = total > 0
    ? data.map(d => {
        const dash = (d.sum / total) * circ;
        const seg  = { ...d, dash, off };
        off += dash;
        return seg;
      })
    : [];

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={20} />
        {/* segments */}
        {segs.length > 0
          ? segs.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth={20}
                strokeDasharray={`${Math.max(s.dash - 3, 0)} ${circ}`}
                strokeDashoffset={-s.off} />
            ))
          : <circle cx={cx} cy={cy} r={r} fill="none"
              stroke={accent + "30"} strokeWidth={20}
              strokeDasharray={`${circ * 0.97} ${circ}`} />
        }
      </svg>
      {/* center label */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none"
      }}>
        <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
          {total > 0 ? total.toFixed(0) : "0"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 2 }}>{cur}</div>
      </div>
    </div>
  );
}

// ── Period helpers ────────────────────────────────────────────────────────────
function getPeriodInfo(period, offset) {
  const now = new Date();

  if (period === "day") {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const dateStr = d.toISOString().split("T")[0];
    const label = offset === 0 ? "დღეს"
                : offset === 1 ? "გუშინ"
                : `${d.getDate()} ${MONTHS_GE[d.getMonth()].slice(0, 3)}`;
    return { type: "day", dateStr, label };
  }

  if (period === "week") {
    const dow   = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - dow - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = d => `${d.getDate()} ${MONTHS_GE[d.getMonth()].slice(0, 3)}`;
    return { type: "week", start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0], startDate: new Date(start),
      label: `${fmt(start)} – ${fmt(end)}` };
  }

  if (period === "month") {
    const d   = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { type: "month", key, month: d.getMonth(), year: d.getFullYear(),
      label: `${MONTHS_GE[d.getMonth()]} ${d.getFullYear()}` };
  }

  // year
  const year = now.getFullYear() - offset;
  return { type: "year", year, label: String(year) };
}

function filterTx(transactions, info, isExpense) {
  const sign = t => isExpense ? t.amount < 0 : t.amount > 0;
  if (info.type === "day")   return transactions.filter(t => t.date === info.dateStr && sign(t));
  if (info.type === "week")  return transactions.filter(t => t.date >= info.start && t.date <= info.end && sign(t));
  if (info.type === "month") return transactions.filter(t => t.date.startsWith(info.key) && sign(t));
  return transactions.filter(t => t.date.startsWith(String(info.year)) && sign(t));
}

function getBarData(txList, info) {
  const sum = list => list.reduce((s, t) => s + Math.abs(t.amount), 0);

  if (info.type === "day") {
    return Array.from({ length: 24 }, (_, h) => ({
      label: h % 6 === 0 ? `${h}:00` : "",
      sum: sum(txList.filter(t => parseInt((t.time || "00:00").split(":")[0]) === h))
    }));
  }
  if (info.type === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(info.startDate);
      d.setDate(info.startDate.getDate() + i);
      return { label: DAYS_GE[i], sum: sum(txList.filter(t => t.date === d.toISOString().split("T")[0])) };
    });
  }
  if (info.type === "month") {
    const days = new Date(info.year, info.month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const day = `${info.key}-${String(i + 1).padStart(2, "0")}`;
      return { label: (i + 1) % 7 === 1 ? String(i + 1) : "", sum: sum(txList.filter(t => t.date === day)) };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const key = `${info.year}-${String(i + 1).padStart(2, "0")}`;
    return { label: MONTHS_GE[i].slice(0, 3), sum: sum(txList.filter(t => t.date.startsWith(key))) };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ transactions, plan, onUpgrade, cur = "₾" }) {
  const [period, setPeriod] = useState("month");
  const [offset, setOffset] = useState(0);
  const [tab,    setTab]    = useState("expense");

  const isPremium = plan !== "free";
  const isExp     = tab === "expense";
  const accent    = isExp ? "#E05470" : "#4CAF82";

  const info     = getPeriodInfo(period, offset);
  const txExp    = filterTx(transactions, info, true);
  const txInc    = filterTx(transactions, info, false);
  const totalExp = txExp.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalInc = txInc.reduce((s, t) => s + t.amount, 0);
  const netSav   = totalInc - totalExp;

  const txList = isExp ? txExp : txInc;
  const total  = isExp ? totalExp : totalInc;

  // categories
  const cats  = isExp ? CATEGORIES : INCOME_CATEGORIES;
  const byCat = cats.map(cat => {
    const s = Math.abs(txList.filter(t => t.category === cat.id).reduce((a, t) => a + t.amount, 0));
    return { ...cat, sum: s, pct: total ? Math.round((s / total) * 100) : 0 };
  }).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum);

  // bar
  const barData = getBarData(txList, info);
  const maxBar  = Math.max(...barData.map(b => b.sum), 1);
  const showBarLabels = period === "week" || period === "year";

  // trend (pro)
  const now = new Date();
  const trendData = Array.from({ length: 5 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const s   = Math.abs(transactions.filter(t => t.date.startsWith(key) && (isExp ? t.amount < 0 : t.amount > 0)).reduce((a, t) => a + t.amount, 0));
    return { label: MONTHS_GE[d.getMonth()].slice(0, 3), sum: s };
  });
  const maxTrend = Math.max(...trendData.map(t => t.sum), 1);

  const maxOff = { day: 365, week: 52, month: 24, year: 5 }[period];

  return (
    <div style={{ padding: "0 0 120px" }}>

      {/* ── Period tabs ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4, marginBottom: 14 }}>
          {[["day","დღე"],["week","კვირა"],["month","თვე"],["year","წელი"]].map(([v, l]) => (
            <button key={v} onClick={() => { setPeriod(v); setOffset(0); }} style={{
              flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
              cursor: "pointer", fontFamily: "inherit",
              background: period === v ? "#4CAF82" : "transparent",
              color: period === v ? "#fff" : "rgba(255,255,255,0.45)",
              fontWeight: period === v ? 700 : 400, fontSize: 13
            }}>{l}</button>
          ))}
        </div>

        {/* ← label → */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => offset < maxOff && setOffset(o => o + 1)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            width: 38, height: 38, fontSize: 22, cursor: offset < maxOff ? "pointer" : "default",
            color: offset < maxOff ? "#fff" : "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>‹</button>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>
            {info.label}
          </span>
          <button onClick={() => offset > 0 && setOffset(o => o - 1)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            width: 38, height: 38, fontSize: 22, cursor: offset > 0 ? "pointer" : "default",
            color: offset > 0 ? "#fff" : "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>›</button>
        </div>
      </div>

      {/* ── Expense / Income tabs ── */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4 }}>
          {[["expense","↓ გასავალი"],["income","↑ შემოსავალი"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              flex: 1, padding: "10px", borderRadius: 12, border: "none",
              cursor: "pointer", fontFamily: "inherit",
              background: tab === v
                ? v === "expense"
                  ? "linear-gradient(135deg,#E05470,#b03050)"
                  : "linear-gradient(135deg,#4CAF82,#2d8f5a)"
                : "transparent",
              color: tab === v ? "#fff" : "rgba(255,255,255,0.45)",
              fontWeight: 700, fontSize: 13
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Donut chart ── */}
      <div style={{ padding: "0 16px 8px" }}>
        <DonutChart data={byCat} total={total} accent={accent} cur={cur} size={200} />
        {total === 0 && (
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", marginTop: 8 }}>
            ამ პერიოდში {isExp ? "გასავალი" : "შემოსავალი"} არ არის
          </p>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "16px 16px", }}>
        {[
          { label: "შემოსავ.", val: totalInc, col: "#4CAF82",  icon: "↑" },
          { label: "გასავ.",   val: totalExp, col: "#E05470",  icon: "↓" },
          { label: netSav >= 0 ? "დაზოგ." : "დეფიც.",
            val: Math.abs(netSav), col: netSav >= 0 ? "#A78BFA" : "#F59E0B",
            icon: netSav >= 0 ? "💰" : "⚠️" },
        ].map(c => (
          <div key={c.label} style={{ background: "#1a2e22", borderRadius: 14,
            padding: "12px 10px", border: `1px solid ${c.col}22` }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>
              {c.icon} {c.label}
            </p>
            <p style={{ color: c.col, fontWeight: 800, fontSize: 14 }}>
              {c.val.toFixed(0)} {cur}
            </p>
          </div>
        ))}
      </div>

      {/* ── Bar chart ── */}
      <div style={{ background: "#1a2e22", borderRadius: 20, padding: "18px 16px",
        margin: "0 16px 20px", border: "1px solid rgba(76,175,82,0.1)" }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          { period === "day" ? "⏱ საათობრივი" : period === "week" ? "📅 დღიური" : period === "month" ? "📅 დღიური" : "📆 თვიური" } გრაფიკი
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: period === "month" ? 2 : 4, height: 80 }}>
          {barData.map((b, i) => (
            <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0",
              height: `${Math.max((b.sum / maxBar) * 76, b.sum > 0 ? 5 : 1)}px`,
              background: b.sum > 0 ? accent + "cc" : accent + "15",
              transition: "height 0.3s"
            }} />
          ))}
        </div>
        {showBarLabels && (
          <div style={{ display: "flex", marginTop: 6 }}>
            {barData.map((b, i) => (
              <span key={i} style={{ flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 9, textAlign: "center" }}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Trend (Pro) ── */}
      <div style={{ position: "relative", margin: "0 16px 20px" }}>
        <div style={{
          background: "#1a2e22", borderRadius: 20, padding: "18px 16px",
          border: "1px solid rgba(255,255,255,0.05)",
          filter: isPremium ? "none" : "blur(3px)",
          pointerEvents: isPremium ? "auto" : "none"
        }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            📈 ტრენდი — 5 თვე
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 70 }}>
            {trendData.map((t, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>
                  {t.sum > 0 ? t.sum.toFixed(0) : ""}
                </span>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${Math.max((t.sum / maxTrend) * 52, t.sum > 0 ? 4 : 2)}px`,
                  background: i === 4 ? accent : accent + "44" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{t.label}</span>
              </div>
            ))}
          </div>
          {trendData[4].sum > 0 && trendData[3].sum > 0 && (
            <p style={{ color: accent + "bb", fontSize: 11, marginTop: 10 }}>
              {trendData[4].sum > trendData[3].sum ? "↑" : "↓"}{" "}
              {Math.abs(Math.round(((trendData[4].sum - trendData[3].sum) / trendData[3].sum) * 100))}%-ით{" "}
              {trendData[4].sum > trendData[3].sum ? "გაიზარდა" : "შემცირდა"} წინა თვეზე
            </p>
          )}
        </div>
        {!isPremium && <PremiumLock plan="Pro" onUpgrade={onUpgrade} />}
      </div>

      {/* ── Categories ── */}
      <div style={{ padding: "0 16px" }}>
        {byCat.length > 0 ? (
          <>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              კატეგორიები
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byCat.map(cat => (
                <div key={cat.id} style={{ background: "#1a2e22", borderRadius: 16,
                  padding: "14px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CategoryIcon cat={cat.id} size={34} />
                      <div>
                        <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{cat.label}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{cat.pct}%</p>
                      </div>
                    </div>
                    <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>
                      {isExp ? "-" : "+"}{cat.sum.toFixed(0)} {cur}
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
          <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            😴 ამ პერიოდში {isExp ? "გასავალი" : "შემოსავალი"} არ გაქვს
          </div>
        )}
      </div>
    </div>
  );
}
