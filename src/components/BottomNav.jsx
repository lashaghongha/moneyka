const NAV_ITEMS = [
  { id: "home",      icon: "🏠", label: "მთავარი" },
  { id: "analytics", icon: "📊", label: "ანალიტ." },
  { id: "add",       icon: "+",  label: "", isAdd: true },
  { id: "goals",     icon: "🎯", label: "მიზნები" },
  { id: "profile",   icon: "👤", label: "პროფილი" },
];

export default function BottomNav({ page, setPage, onAdd, plan }) {
  const isPremium   = plan !== "free";
  const premiumColor = plan === "elite" ? "#F59E0B" : "#A78BFA";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 390,
      background: "rgba(10,22,15,0.97)", backdropFilter: "blur(20px)",
      borderTop: `1px solid ${isPremium ? premiumColor + "33" : "rgba(76,175,82,0.15)"}`,
      padding: "8px 0 20px", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-around"
    }}>
      {NAV_ITEMS.map(item => {
        if (item.isAdd) return (
          <button key="add" onClick={onAdd} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: isPremium
              ? `linear-gradient(135deg,${premiumColor},${plan === "elite" ? "#D97706" : "#7C3AED"})`
              : "linear-gradient(135deg,#4CAF82,#2d8f5a)",
            border: "none", cursor: "pointer", fontSize: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px ${isPremium ? premiumColor + "66" : "rgba(76,175,82,0.5)"}`,
            transform: "translateY(-6px)", color: "#fff", fontWeight: 700
          }}>+</button>
        );
        const active      = page === item.id;
        const activeColor = isPremium ? premiumColor : "#4CAF82";
        return (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 8px"
          }}>
            <span style={{ fontSize: 20, filter: active ? "none" : "grayscale(1) opacity(0.4)" }}>{item.icon}</span>
            <span style={{ fontSize: 9, color: active ? activeColor : "rgba(255,255,255,0.3)", fontWeight: active ? 700 : 400 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
