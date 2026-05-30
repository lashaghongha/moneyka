import { useState } from "react";
import * as api from "../api";
import PremiumLock from "../components/PremiumLock";

const DAYS    = ["კვ", "ორ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const DAYS_GE = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];

export default function HabitsPage({ transactions, isPremium, isElite, onUpgrade, cur = "₾" }) {
  const [aiText, setAiText]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 280 }}>
        <div style={{ filter: "blur(4px)", pointerEvents: "none", background: "#1a2e22", padding: "20px", borderRadius: 20 }}>
          <p style={{ color: "#F59E0B", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🧠 ჩვევების ანალიზი</p>
          {["კვირის ყველაზე ძვირი დღე: შაბათი", "საღამოს ხარჯვა 40% მეტია", "სუპერმარკეტი — 3x კვირაში"].map((h, i) => (
            <div key={i} style={{ background: "rgba(245,158,11,0.1)", borderRadius: 12, padding: "12px", marginBottom: 8 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>📈 {h}</p>
            </div>
          ))}
        </div>
        <PremiumLock plan="Elite" onUpgrade={onUpgrade} />
      </div>
    </div>
  );

  // ─── ბოლო 30 დღის ხარჯები ────────────────────────────────────────────────
  const now     = new Date();
  const ago30   = new Date(now); ago30.setDate(ago30.getDate() - 30);
  const ago30s  = ago30.toISOString().split("T")[0];

  const expenses = transactions.filter(t => t.amount < 0 && t.date >= ago30s);
  const total30  = Math.abs(expenses.reduce((s, t) => s + t.amount, 0));

  // ─── კვირის დღეების ანალიზი ──────────────────────────────────────────────
  // dayTotals[0]=კვირა … [6]=შაბათი
  const dayTotals  = Array(7).fill(0);
  const dayCounts  = Array(7).fill(0);
  expenses.forEach(t => {
    const d = new Date(t.date).getDay(); // 0=Sun…6=Sat
    dayTotals[d] += Math.abs(t.amount);
    dayCounts[d]++;
  });
  const dayAvg = dayTotals.map((s, i) => dayCounts[i] ? s / dayCounts[i] : 0);
  const maxDay = Math.max(...dayAvg, 1);

  const busiestDayIdx  = dayAvg.indexOf(Math.max(...dayAvg));
  const weekdayAvg     = (dayAvg[1] + dayAvg[2] + dayAvg[3] + dayAvg[4] + dayAvg[5]) / 5 || 1;
  const weekendAvg     = (dayAvg[0] + dayAvg[6]) / 2;
  const weekendPct     = weekendAvg > weekdayAvg
    ? Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)
    : 0;

  // ─── საღამოს ხარჯვა (18:00+) ─────────────────────────────────────────────
  const withTime    = expenses.filter(t => t.time);
  const eveningExp  = withTime.filter(t => parseInt(t.time) >= 18);
  const dayExp      = withTime.filter(t => parseInt(t.time) < 18);
  const eveningSum  = Math.abs(eveningExp.reduce((s, t) => s + t.amount, 0));
  const daySum      = Math.abs(dayExp.reduce((s, t) => s + t.amount, 0));
  const eveningPct  = daySum > 0 ? Math.round(((eveningSum - daySum / (withTime.length || 1) * eveningExp.length) / daySum) * 100) : 0;

  // ─── საკვები / კომუნალური სიხშირე ────────────────────────────────────────
  const foodTxs  = expenses.filter(t => t.category === "food");
  const foodFreq = foodTxs.length > 0 ? (foodTxs.length / 4.3).toFixed(1) : "0"; // per week
  const foodAvg  = foodTxs.length > 0
    ? Math.round(Math.abs(foodTxs.reduce((s, t) => s + t.amount, 0)) / foodTxs.length)
    : 0;

  // ─── გართობა ─────────────────────────────────────────────────────────────
  const entTxs      = expenses.filter(t => t.category === "entertainment");
  const prevEntTxs  = transactions.filter(t => {
    const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
    return t.amount < 0 && t.category === "entertainment"
      && t.date >= d60.toISOString().split("T")[0] && t.date < ago30s;
  });
  const entSum     = Math.abs(entTxs.reduce((s, t) => s + t.amount, 0));
  const prevEntSum = Math.abs(prevEntTxs.reduce((s, t) => s + t.amount, 0));
  const entChange  = prevEntSum > 0 ? Math.round(((entSum - prevEntSum) / prevEntSum) * 100) : 0;

  // ─── ყველაზე ძვირი კატეგორია ─────────────────────────────────────────────
  const catMap = {};
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
  });
  const topCatId  = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCatPct = topCatId && total30 > 0 ? Math.round((topCatId[1] / total30) * 100) : 0;

  const CAT_LABELS = { food:"საკვები", transport:"ტრანსპორტი", car:"მანქანა", fuel:"საწვავი",
    entertainment:"გართობა", health:"ჯანმრთელობა", clothes:"ტანსაცმელი",
    utilities:"კომუნალური", education:"განათლება", other:"სხვა" };

  async function loadAiSuggestions() {
    setAiLoading(true);
    setAiText(null);
    try {
      const byCat = Object.entries(catMap).map(([id, total]) => ({
        label: CAT_LABELS[id] || id,
        total: parseFloat(total.toFixed(2))
      }));
      const data = await api.getHabitsSuggestions({
        byCat,
        totalSpend: parseFloat(total30.toFixed(2)),
        busiestDay: expenses.length > 0 ? DAYS_GE[busiestDayIdx] : "—",
        eveningPct,
        foodFreqPerWeek: foodFreq,
        foodAvg,
        weekendPct
      });
      setAiText(data.text);
    } catch {
      setAiText("კავშირის შეცდომა. სცადე მოგვიანებით.");
    }
    setAiLoading(false);
  }

  // ─── სმარტ შეთავაზებები ──────────────────────────────────────────────────
  const suggestions = [];
  if (weekendPct > 20) {
    const save = Math.round(weekendAvg * 0.2 * 8);
    suggestions.push({
      icon: "🎯", tip: "შაბათ-კვირა ბიუჯეტი",
      desc: `შაბათ-კვირა ${weekendPct}%-ით მეტი ხარჯავ. ლიმიტი დაადე და დაზოგე ~${save}${cur}/თვე`,
      save
    });
  }
  if (eveningPct > 15 && withTime.length > 3) {
    const save = Math.round(eveningSum * 0.2);
    suggestions.push({
      icon: "🌙", tip: "საღამოს ხარჯვა",
      desc: `18:00 შემდეგ ხარჯი ${eveningPct > 0 ? eveningPct + "% " : ""}მეტია. სავაჭრო სია გაიკეთე შუადღეს.`,
      save
    });
  }
  if (topCatId && topCatPct > 35) {
    const save = Math.round(topCatId[1] * 0.1);
    suggestions.push({
      icon: "📊", tip: `${CAT_LABELS[topCatId[0]] || topCatId[0]} — ${topCatPct}%`,
      desc: `ხარჯების ${topCatPct}% ${CAT_LABELS[topCatId[0]] || topCatId[0]}-ზე. 10%-ის შემცირება დაზოგავს ${save}${cur}/თვე.`,
      save
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      icon: "✅", tip: "კარგი ბალანსი!",
      desc: "ბოლო 30 დღეში ხარჯვა ბალანსირებულია. გააგრძელე ასე!", save: 0
    });
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#2a1a00,#1a1000)", borderRadius: 20,
        padding: "18px", marginBottom: 20, border: "1px solid rgba(245,158,11,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <p style={{ color: "#F59E0B", fontWeight: 700, fontSize: 15 }}>AI ჩვევების ანალიზი</p>
          <span style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B",
            fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Elite</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          ბოლო 30 დღე · {expenses.length} ტრანზაქცია · {total30.toFixed(2)}{cur} ჯამი
        </p>
      </div>

      {/* Week chart — real data */}
      <div style={{ background: "#1a2e22", borderRadius: 20, padding: "18px", marginBottom: 20,
        border: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
          კვირის ხარჯვა (საშუალო)
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
          {dayAvg.map((d, i) => {
            const isWeekend = i === 0 || i === 6;
            const isTop     = i === busiestDayIdx;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {d > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>{Math.round(d)}</span>
                )}
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${Math.max((d / maxDay) * 60, d > 0 ? 3 : 1)}px`,
                  background: isTop ? "#F59E0B" : isWeekend ? "rgba(245,158,11,0.45)" : "rgba(76,175,82,0.4)"
                }} />
                <span style={{
                  color: isTop ? "#F59E0B" : "rgba(255,255,255,0.35)",
                  fontSize: 10, fontWeight: isTop ? 700 : 400
                }}>{DAYS[i]}</span>
              </div>
            );
          })}
        </div>
        {weekendPct > 0 && (
          <p style={{ color: "rgba(245,158,11,0.7)", fontSize: 11, marginTop: 10 }}>
            ⚠️ შაბათ-კვირა {weekendPct}% მეტია სამუშაო დღეებთან შედარებით
          </p>
        )}
        {expenses.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
            ბოლო 30 დღეში ჩანაწერი არ არის
          </p>
        )}
      </div>

      {/* Habits grid — real data */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#1a2e22", borderRadius: 18, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, marginBottom: 4 }}>ყველაზე ძვირი დღე</p>
          <p style={{ color: "#F59E0B", fontWeight: 800, fontSize: 16 }}>
            {expenses.length > 0 ? DAYS_GE[busiestDayIdx] : "—"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
            {expenses.length > 0 ? `საშ. ${Math.round(dayAvg[busiestDayIdx])}${cur}` : "მონაცემი არ არის"}
          </p>
        </div>

        <div style={{ background: "#1a2e22", borderRadius: 18, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 22 }}>🌙</span>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, marginBottom: 4 }}>საღამოს ხარჯვა</p>
          <p style={{ color: "#E05470", fontWeight: 800, fontSize: 16 }}>
            {withTime.length > 3 ? `${eveningPct > 0 ? "+" : ""}${eveningPct}%` : "—"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>18:00 საათის შემდეგ</p>
        </div>

        <div style={{ background: "#1a2e22", borderRadius: 18, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, marginBottom: 4 }}>საკვები</p>
          <p style={{ color: "#4CAF82", fontWeight: 800, fontSize: 16 }}>
            {foodTxs.length > 0 ? `${foodFreq}x კვირაში` : "—"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
            {foodTxs.length > 0 ? `საშ. ${foodAvg}${cur} ვიზიტზე` : "ჩანაწერი არ არის"}
          </p>
        </div>

        <div style={{ background: "#1a2e22", borderRadius: 18, padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 22 }}>🎬</span>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8, marginBottom: 4 }}>გართობა</p>
          <p style={{ color: "#4A90D9", fontWeight: 800, fontSize: 16 }}>
            {entTxs.length > 0 ? `${entChange > 0 ? "↑" : entChange < 0 ? "↓" : "="} ${Math.abs(entChange)}%` : "—"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
            {entTxs.length > 0 ? "გასულ თვეზე" : "ჩანაწერი არ არის"}
          </p>
        </div>
      </div>

      {/* Top category bar */}
      {topCatId && (
        <div style={{ background: "#1a2e22", borderRadius: 16, padding: "14px 16px",
          marginBottom: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              🏆 ყველაზე დიდი ხარჯი: <span style={{ color: "#fff", fontWeight: 700 }}>
                {CAT_LABELS[topCatId[0]] || topCatId[0]}
              </span>
            </p>
            <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>{topCatPct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6 }}>
            <div style={{ width: `${topCatPct}%`, height: "100%", background: "#F59E0B", borderRadius: 6 }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6 }}>
            {topCatId[1].toFixed(2)}{cur} ბოლო 30 დღეში
          </p>
        </div>
      )}

      {/* AI Suggestions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14 }}>
          💡 სმარტ შეთავაზებები
        </p>
        <button
          onClick={loadAiSuggestions}
          disabled={aiLoading}
          style={{
            background: aiLoading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#34d399,#059669)",
            border: "none", borderRadius: 12, padding: "7px 14px",
            color: "#fff", fontWeight: 700, fontSize: 12,
            cursor: aiLoading ? "default" : "pointer", fontFamily: "inherit",
            opacity: aiLoading ? 0.7 : 1
          }}
        >
          {aiLoading ? "⏳ ანალიზდება..." : "✨ AI ანალიზი"}
        </button>
      </div>

      {/* AI response */}
      {aiText && (
        <div style={{ background: "linear-gradient(135deg,#0d2a1a,#071a0f)", borderRadius: 18,
          padding: "18px", marginBottom: 14, border: "1px solid rgba(52,211,153,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ color: "#34d399", fontWeight: 700, fontSize: 13 }}>🤖 Groq AI · უფასო</p>
            <button onClick={() => setAiText(null)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 16, padding: 0
            }}>✕</button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {aiText}
          </p>
        </div>
      )}

      {/* Rule-based fallback */}
      {!aiText && suggestions.map((s, i) => (
        <div key={i} style={{ background: "linear-gradient(135deg,#1a2a0e,#0d1a0a)", borderRadius: 16,
          padding: "16px", marginBottom: 10, border: "1px solid rgba(76,175,82,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{s.icon}</span>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{s.tip}</p>
            </div>
            {s.save > 0 && (
              <span style={{ background: "rgba(76,175,82,0.15)", color: "#4CAF82",
                fontSize: 11, padding: "3px 8px", borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>
                +{s.save}{cur}
              </span>
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5, paddingLeft: 28 }}>
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
