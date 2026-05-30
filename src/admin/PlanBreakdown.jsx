import Card from "./Card";
import { PLAN_COLOR, PLAN_PRICE } from "./adminConstants";

export default function PlanBreakdown({ planCounts, total }) {
  return (
    <Card style={{ marginBottom: 24 }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
        📊 პლანების განაწილება
      </p>
      {(planCounts ?? []).map(p => {
        const pct = total ? Math.round((p.count / total) * 100) : 0;
        const c   = PLAN_COLOR[p.plan] ?? "#95A5A6";
        const rev = (p.count * (PLAN_PRICE[p.plan] ?? 0)).toFixed(2);
        return (
          <div key={p.plan} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                {p.plan === "free" ? "🆓" : p.plan === "pro" ? "⭐" : "👑"} {p.plan}
              </span>
              <span style={{ color: c, fontWeight: 700, fontSize: 13 }}>
                {p.count} მომხ. · {pct}% · {rev}₾/თვე
              </span>
            </div>
            <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 6 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 6, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
