import { CATEGORIES, INCOME_CATEGORIES } from "../constants";

const ALL_CATS = [...CATEGORIES, ...INCOME_CATEGORIES];

export default function CategoryIcon({ cat, size = 36 }) {
  const c = ALL_CATS.find(x => x.id === cat) || CATEGORIES[7];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c.color + "22", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.44, flexShrink: 0,
      border: `1.5px solid ${c.color}44`
    }}>
      {c.icon}
    </div>
  );
}
