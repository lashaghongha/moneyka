import { useState } from "react";
import { PLANS } from "../constants";
import PaymentModal from "../components/PaymentModal";

export default function PremiumPage({ currentPlan, onSelectPlan, onClose }) {
  const [selected,  setSelected]  = useState("pro");
  const [billing,   setBilling]   = useState("monthly");
  const [showPay,   setShowPay]   = useState(false);

  return (
    <div style={{ padding: "0 0 100px", overflowX: "hidden" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1a0d3a 0%, #0d0d2e 60%, #160d2e 100%)",
        padding: "28px 24px 32px", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(167,139,250,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 250, height: 250,
          borderRadius: "50%", background: "rgba(124,58,237,0.06)", pointerEvents: "none" }} />

        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
          <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            MoneyKa Premium
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5 }}>
            ჭკვიანი ფინანსები, ჯიბეში.<br />გაიუმჯობესე ახლავე.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 4, marginTop: 24, position: "relative" }}>
          {[["monthly", "ყოველთვიური"], ["yearly", "ყოველწლიური"]].map(([v, l]) => (
            <button key={v} onClick={() => setBilling(v)} style={{
              flex: 1, padding: "10px", borderRadius: 12, border: "none", cursor: "pointer",
              background: billing === v ? "linear-gradient(135deg,#A78BFA,#7C3AED)" : "transparent",
              color: billing === v ? "#fff" : "rgba(255,255,255,0.5)",
              fontWeight: 700, fontSize: 13, fontFamily: "inherit", position: "relative"
            }}>
              {l}
              {v === "yearly" && (
                <span style={{ position: "absolute", top: -8, right: 4,
                  background: "#4CAF82", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
                  -40%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Plan Cards */}
        {PLANS.filter(p => p.id !== "free").map(plan => {
          const isSel    = selected === plan.id;
          const price    = billing === "yearly"
            ? (plan.price * 12 * 0.6 / 12).toFixed(2)
            : plan.price.toFixed(2);
          const isCurrent = currentPlan === plan.id;

          return (
            <div key={plan.id} onClick={() => setSelected(plan.id)} style={{
              background: isSel ? `linear-gradient(135deg, ${plan.color}18, ${plan.color}08)` : "#1a2e22",
              border: isSel ? `2px solid ${plan.color}` : "2px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: "18px", marginBottom: 14, cursor: "pointer",
              position: "relative", transition: "all 0.2s"
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -10, right: 16,
                  background: `linear-gradient(135deg,${plan.color},${plan.color}cc)`,
                  borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: "absolute", top: -10, left: 16,
                  background: "#4CAF82", borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                  მიმდინარე
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: plan.color + "22",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {plan.id === "pro" ? "⭐" : "👑"}
                    </div>
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{plan.name}</span>
                  </div>
                  {billing === "yearly" && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4, textDecoration: "line-through" }}>
                      {plan.price.toFixed(2)} ₾/თვე
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: plan.color, fontWeight: 800, fontSize: 22 }}>{price} ₾</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>/ თვეში</p>
                  {billing === "yearly" && (
                    <p style={{ color: "#4CAF82", fontSize: 10, fontWeight: 600 }}>
                      {(price * 12).toFixed(2)} ₾/წელი
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 8px" }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: f.ok ? plan.color : "rgba(255,255,255,0.2)" }}>
                      {f.ok ? "✓" : "✗"}
                    </span>
                    <span style={{ color: f.ok ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)", fontSize: 11 }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {isSel && (
                <div style={{ position: "absolute", top: 16, right: 16, width: 22, height: 22,
                  borderRadius: "50%", background: plan.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}

        {/* CTA */}
        <button onClick={() => setShowPay(true)} style={{
          width: "100%",
          background: selected === "elite"
            ? "linear-gradient(135deg,#F59E0B,#D97706)"
            : "linear-gradient(135deg,#A78BFA,#7C3AED)",
          border: "none", borderRadius: 18, padding: "18px",
          color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: selected === "elite"
            ? "0 8px 28px rgba(245,158,11,0.4)"
            : "0 8px 28px rgba(124,58,237,0.4)",
          marginBottom: 12
        }}>
          {PLANS.find(p => p.id === selected)?.name} — გამოწერა →
        </button>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
          7 დღე უფასოდ · გაუქმება ნებისმიერ დროს
        </p>

        {showPay && (
          <PaymentModal
            plan={selected}
            price={PLANS.find(p => p.id === selected)?.price || 3.99}
            billing={billing}
            onSuccess={() => { setShowPay(false); onSelectPlan(selected); }}
            onClose={() => setShowPay(false)}
          />
        )}

        {/* Free plan compare */}
        <div style={{ marginTop: 24, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>უფასო პაკეტი მოიცავს:</p>
          {PLANS[0].features.filter(f => f.ok).map((f, i) => (
            <p key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 4 }}>✓ {f.text}</p>
          ))}
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8 }}>
            {onClose && (
              <span onClick={onClose} style={{ cursor: "pointer", textDecoration: "underline" }}>
                უფასოდ გაგრძელება →
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
