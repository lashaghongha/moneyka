import { CATEGORIES } from "../constants";
import SectionHeader from "../components/SectionHeader";
import TxRow from "../components/TxRow";

const ALL_CURRENCIES = ["₾", "$", "€"];

function txCur(tx) { return tx.currency || "₾"; }

export default function HomePage({ transactions, goals, onAddTx, plan, onUpgrade, onNavigate, cur = "₾" }) {
  const now       = new Date();
  const monthKey  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const thisMonth = transactions.filter(t => t.date.startsWith(monthKey));
  const recent    = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const isPremium = plan !== "free";
  const txCount   = transactions.length;
  const freeLimit = 100;

  // ── Per-currency balances ──────────────────────────────────────────────────
  const balByCur = {};
  transactions.forEach(t => {
    const c = txCur(t);
    balByCur[c] = (balByCur[c] || 0) + t.amount;
  });

  // Primary balance = GEL (₾) or fallback to first available
  const balance = balByCur["₾"] || 0;

  // Secondary balances (non-₾)
  const secondaryCurs = ALL_CURRENCIES.filter(c => c !== "₾" && balByCur[c]);

  // This month income/expense — primary (₾) only for the stat cards
  const gelMonth = thisMonth.filter(t => txCur(t) === "₾");
  const income   = gelMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense  = gelMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding: "0 0 100px" }}>
      {/* Hero */}
      <div style={{
        background: isPremium
          ? "linear-gradient(135deg, #1a0d3a 0%, #0d0d2e 50%, #1a0d3a 100%)"
          : "linear-gradient(135deg, #1a3a2a 0%, #0d2419 50%, #162d1f 100%)",
        padding: "28px 24px 32px", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180,
          borderRadius: "50%", background: isPremium ? "rgba(167,139,250,0.08)" : "rgba(76,175,82,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -30, width: 200, height: 200,
          borderRadius: "50%", background: isPremium ? "rgba(124,58,237,0.05)" : "rgba(76,175,82,0.05)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, letterSpacing: "0.05em" }}>მთლიანი ბალანსი</p>
              {isPremium && (
                <span style={{
                  background: plan === "elite" ? "rgba(245,158,11,0.2)" : "rgba(167,139,250,0.2)",
                  color: plan === "elite" ? "#F59E0B" : "#A78BFA",
                  fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700
                }}>
                  {plan === "elite" ? "👑 Elite" : "⭐ Pro"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                {balance.toLocaleString()}
              </span>
              <span style={{ fontSize: 24, color: isPremium ? "#A78BFA" : "#4CAF82", fontWeight: 700 }}>₾</span>
            </div>
            {/* Secondary currency balances */}
            {secondaryCurs.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {secondaryCurs.map(c => (
                  <div key={c} style={{
                    background: "rgba(255,255,255,0.08)", borderRadius: 10,
                    padding: "3px 10px", display: "flex", alignItems: "center", gap: 4
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                      {c === "$" ? "🇺🇸" : "🇪🇺"}
                    </span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                      {(balByCur[c] || 0) >= 0 ? "" : "-"}
                      {Math.abs(balByCur[c] || 0).toLocaleString()} {c}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>განახლდა ახლა</p>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 16,
            background: isPremium ? "rgba(167,139,250,0.2)" : "rgba(76,175,82,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
            💳
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
          {[
            { label: "შემოსავალი", val: income,              icon: "↑", col: "#4CAF82" },
            { label: "გასავალი",   val: Math.abs(expense),   icon: "↓", col: "#E05470" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: item.col, fontWeight: 700 }}>{item.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{item.label}</span>
              </div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>
                {item.val.toLocaleString()} <span style={{ color: item.col, fontSize: 13 }}>₾</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Free plan limit */}
        {!isPremium && (
          <div onClick={onUpgrade} style={{
            background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
            borderRadius: 16, padding: "12px 16px", marginTop: 16, marginBottom: 4,
            display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer"
          }}>
            <div>
              <p style={{ color: "#A78BFA", fontWeight: 600, fontSize: 13 }}>🔒 {txCount}/{freeLimit} ტრანზაქცია</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>გაიუმჯობესე Pro-ზე</p>
            </div>
            <div style={{ height: 6, width: 80, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
              <div style={{ height: "100%", width: `${(txCount / freeLimit) * 100}%`, background: "#A78BFA", borderRadius: 6 }} />
            </div>
          </div>
        )}

        {/* Quick Add */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 20, marginBottom: 24 }}>
          {CATEGORIES.slice(0, 4).map(cat => (
            <button key={cat.id} onClick={() => onAddTx(cat.id)} style={{
              background: "#1a2e22", border: "1px solid rgba(76,175,82,0.2)",
              borderRadius: 14, padding: "12px 4px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5
            }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, textAlign: "center" }}>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Goals */}
        <SectionHeader title="მიზნები" action="ყველა" onAction={() => onNavigate?.("goals")} />
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {goals.map(g => {
            const pct = Math.round((g.saved / g.target) * 100);
            return (
              <div key={g.id} style={{ background: "#1a2e22", borderRadius: 18, padding: "14px 16px",
                border: "1px solid rgba(76,175,82,0.15)", minWidth: 140, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{g.icon}</span>
                  <span style={{ color: g.color, fontWeight: 700, fontSize: 13 }}>{pct}%</span>
                </div>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{g.title}</p>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: g.color, borderRadius: 4 }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 5 }}>
                  {g.saved.toLocaleString()} / {g.target.toLocaleString()} {cur}
                </p>
              </div>
            );
          })}
          {!isPremium && (
            <div onClick={onUpgrade} style={{
              background: "rgba(167,139,250,0.08)", borderRadius: 18, padding: "14px 16px",
              border: "2px dashed rgba(167,139,250,0.3)", minWidth: 120, flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer"
            }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <span style={{ color: "#A78BFA", fontSize: 11, fontWeight: 600, textAlign: "center" }}>Pro-ით მეტი მიზანი</span>
            </div>
          )}
        </div>

        {/* Recent */}
        <SectionHeader title="ბოლო ტრანზაქციები" action="ყველა" onAction={() => onNavigate?.("transactions")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.map(tx => <TxRow key={tx.id} tx={tx} cur={cur} />)}
        </div>
      </div>
    </div>
  );
}
