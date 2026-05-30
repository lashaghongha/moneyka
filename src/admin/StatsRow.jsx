import Card from "./Card";

export default function StatsRow({ stats }) {
  const cards = [
    { label: "სულ მომხმარებელი", value: stats.totalUsers,                             icon: "👥", color: "#4CAF82" },
    { label: "ახალი ამ კვირაში",  value: stats.newThisWeek,                            icon: "🆕", color: "#4A90D9" },
    { label: "აქტიური დღეს",     value: stats.activeToday,                            icon: "🟢", color: "#A78BFA" },
    { label: "თვ. შემოსავალი",   value: `${(stats.monthlyRevenue ?? 0).toFixed(2)}₾`, icon: "💰", color: "#F59E0B" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: 14, marginBottom: 24
    }}>
      {cards.map(c => (
        <Card key={c.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{c.icon}</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{c.label}</span>
          </div>
          <p style={{ color: c.color, fontWeight: 800, fontSize: 32 }}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
