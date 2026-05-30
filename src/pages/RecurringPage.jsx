import PremiumLock from "../components/PremiumLock";
import CategoryIcon from "../components/CategoryIcon";

export default function RecurringPage({ transactions, isPremium, onUpgrade, cur = "₾" }) {
  const recurring = transactions.filter(t => t.recurring);

  // უნიკალური განმეორებადები — desc-ის მიხედვით გავაერთიანოთ
  const uniqueMap = new Map();
  recurring.forEach(t => {
    const key = `${t.desc}__${t.amount > 0 ? "inc" : "exp"}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, t);
    } else {
      // ყველაზე ახლანდელი ჩანაწერი
      const existing = uniqueMap.get(key);
      if (t.date > existing.date) uniqueMap.set(key, t);
    }
  });
  const uniqueRecurring = Array.from(uniqueMap.values());

  const monthlyOut = parseFloat(
    uniqueRecurring.filter(t => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)
  );
  const monthlyIn = parseFloat(
    uniqueRecurring.filter(t => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0).toFixed(2)
  );

  // მომდევნო გადასახდელი — ყველაზე ახლო nextDate
  const now = new Date();
  const nextSub = uniqueRecurring
    .filter(t => t.amount < 0)
    .map(t => {
      // სავარაუდო შემდეგი გადახდა: date + 1 month
      const d = new Date(t.date);
      while (d <= now) {
        t.recFreq === "yearly"
          ? d.setFullYear(d.getFullYear() + 1)
          : d.setMonth(d.getMonth() + 1);
      }
      return { ...t, nextPay: d };
    })
    .sort((a, b) => a.nextPay - b.nextPay)[0];

  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ filter: "blur(3px)", pointerEvents: "none", background: "#1a2e22", padding: "20px", borderRadius: 20 }}>
          <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🔁 განმეორებადი გადასახადები</p>
          {[{ d: "Netflix", a: -15 }, { d: "Spotify", a: -8 }, { d: "მობილური", a: -25 }, { d: "ხელფასი", a: 2800 }].map((r, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px", marginBottom: 8,
              display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>🔁 {r.d}</span>
              <span style={{ color: r.a < 0 ? "#E05470" : "#4CAF82", fontSize: 13 }}>{r.a < 0 ? "-" : "+"}{Math.abs(r.a)}{cur}</span>
            </div>
          ))}
        </div>
        <PremiumLock plan="Pro" onUpgrade={onUpgrade} />
      </div>
    </div>
  );

  const freqLabel = { monthly: "ყოველთვე", weekly: "ყოველ კვირა", yearly: "ყოველ წელს" };

  const MONTHS_GE = ["იანვ","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(224,84,112,0.12)", borderRadius: 18, padding: "16px", border: "1px solid rgba(224,84,112,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>ყოველთვ. გასავალი</p>
          <p style={{ color: "#E05470", fontWeight: 800, fontSize: 22 }}>{monthlyOut.toFixed(2)}{cur}</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>
            {uniqueRecurring.filter(t => t.amount < 0).length} სუბსკრიფცია
          </p>
        </div>
        <div style={{ background: "rgba(76,175,82,0.12)", borderRadius: 18, padding: "16px", border: "1px solid rgba(76,175,82,0.2)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>ყოველთვ. შემოსავ.</p>
          <p style={{ color: "#4CAF82", fontWeight: 800, fontSize: 22 }}>{monthlyIn.toLocaleString()}{cur}</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>
            {uniqueRecurring.filter(t => t.amount > 0).length} წყარო
          </p>
        </div>
      </div>

      {/* Next payment */}
      {nextSub && (
        <div style={{ background: "rgba(167,139,250,0.1)", borderRadius: 16, padding: "12px 16px", marginBottom: 20, border: "1px solid rgba(167,139,250,0.2)" }}>
          <p style={{ color: "#A78BFA", fontSize: 13, fontWeight: 600 }}>
            📅 მომდევნო: {nextSub.desc} — {nextSub.nextPay.getDate()} {MONTHS_GE[nextSub.nextPay.getMonth()]} (-{Math.abs(nextSub.amount).toFixed(2)}{cur})
          </p>
        </div>
      )}

      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
        სუბსქრიფციები & შემოსავლები
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {uniqueRecurring
          .sort((a, b) => (a.amount > 0 ? 1 : -1) - (b.amount > 0 ? 1 : -1))
          .map(tx => {
            const isExp = tx.amount < 0;
            return (
              <div key={`${tx.desc}_${isExp}`} style={{
                background: "#1a2e22", borderRadius: 16, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                border: `1px solid ${isExp ? "rgba(224,84,112,0.12)" : "rgba(76,175,82,0.12)"}`
              }}>
                <CategoryIcon cat={tx.category} size={38} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{tx.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA",
                      fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 600 }}>
                      🔁 {freqLabel[tx.recFreq] || "ყოველთვე"}
                    </span>
                  </div>
                </div>
                <span style={{ color: isExp ? "#E05470" : "#4CAF82", fontWeight: 700, fontSize: 15 }}>
                  {isExp ? "-" : "+"}{Math.abs(tx.amount).toFixed(2)}{cur}
                </span>
              </div>
            );
          })}
      </div>

      {/* Annual projection */}
      <div style={{ marginTop: 20, background: "linear-gradient(135deg,#1a0d3a,#0d0d2e)", borderRadius: 20,
        padding: "18px", border: "1px solid rgba(167,139,250,0.15)" }}>
        <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📊 წლიური პროგნოზი</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>მთლიანი შემოსავალი</span>
          <span style={{ color: "#4CAF82", fontWeight: 700 }}>{(monthlyIn * 12).toLocaleString()}{cur}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>მთლიანი სუბსქ.</span>
          <span style={{ color: "#E05470", fontWeight: 700 }}>-{(monthlyOut * 12).toFixed(2)}{cur}</span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>სუფთა</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            {((monthlyIn - monthlyOut) * 12).toFixed(2)}{cur}
          </span>
        </div>
      </div>
    </div>
  );
}
