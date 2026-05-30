import { PLAN_COLOR } from "./adminConstants";

export default function Badge({ plan }) {
  const c = PLAN_COLOR[plan] ?? "#95A5A6";
  return (
    <span style={{
      background: c + "22", color: c,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 12, fontWeight: 700,
      border: `1px solid ${c}44`
    }}>
      {plan === "free" ? "🆓" : plan === "pro" ? "⭐" : "👑"} {plan}
    </span>
  );
}
