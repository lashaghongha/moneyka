export const PLAN_COLOR = { free: "#4CAF82", pro: "#A78BFA", elite: "#F59E0B" };
export const PLAN_PRICE = { free: 0, pro: 3.99, elite: 7.99 };

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ახლახანს";
  if (m < 60) return `${m}წთ წინ`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}სთ წინ`;
  return `${Math.floor(h / 24)}დ წინ`;
}
