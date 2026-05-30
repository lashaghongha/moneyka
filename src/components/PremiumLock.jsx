export default function PremiumLock({ plan = "Pro", onUpgrade, compact = false }) {
  if (compact) return (
    <div onClick={onUpgrade} style={{
      display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
      background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)",
      borderRadius: 20, padding: "4px 10px"
    }}>
      <span style={{ fontSize: 12 }}>🔒</span>
      <span style={{ color: "#A78BFA", fontSize: 11, fontWeight: 600 }}>{plan}</span>
    </div>
  );

  return (
    <div onClick={onUpgrade} style={{
      position: "absolute", inset: 0, borderRadius: "inherit",
      background: "rgba(10,22,15,0.85)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", zIndex: 10, gap: 8
    }}>
      <div style={{ fontSize: 32 }}>🔒</div>
      <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Premium ფუნქცია</p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center", maxWidth: 200 }}>
        {plan} პაკეტით განბლოკე
      </p>
      <div style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)", borderRadius: 12, padding: "8px 20px", marginTop: 4 }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>გაიუმჯობესე →</span>
      </div>
    </div>
  );
}
