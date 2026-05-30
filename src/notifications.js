// ─── Browser notification helper ─────────────────────────────────────────────

export async function requestPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title, body, icon = "/icon-192.png") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon, badge: icon, lang: "ka" });
  } catch {}
}

// ─── Budget warning: if expenses >= 80% of income this month ─────────────────
export function checkBudgetWarning(transactions, cur = "₾") {
  if (localStorage.getItem("mk_notif") === "0") return;

  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastSent = localStorage.getItem("mk_notif_budget_sent");
  if (lastSent === monthKey) return; // ამ თვეში უკვე გავაგზავნეთ

  const monthTx  = transactions.filter(t => t.date?.startsWith(monthKey));
  const income   = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(monthTx.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  if (income > 0 && expenses >= income * 0.8) {
    const pct = Math.round((expenses / income) * 100);
    sendNotification(
      "💸 ბიუჯეტის გაფრთხილება",
      `ამ თვეს შემოსავლის ${pct}% დახარჯე (${expenses.toFixed(0)}${cur} / ${income.toFixed(0)}${cur})`
    );
    localStorage.setItem("mk_notif_budget_sent", monthKey);
  }
}

// ─── Subscription reminder: notify if any sub is due tomorrow ────────────────
export function checkSubscriptionReminders(subs, cur = "₾") {
  if (localStorage.getItem("mk_notif_sub") === "0") return;

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  subs.filter(s => s.active && s.nextDate === tomorrowStr).forEach(s => {
    const sentKey = `mk_notif_sub_sent_${s.id}_${tomorrowStr}`;
    if (localStorage.getItem(sentKey)) return;

    sendNotification(
      `📅 ხვალ გასაახლებელია: ${s.name}`,
      `${s.name}-ის გადასახადი ხვალ არის — ${s.price.toFixed(2)}${cur}`
    );
    localStorage.setItem(sentKey, "1");
  });
}
