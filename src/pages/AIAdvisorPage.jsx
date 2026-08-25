import { useState } from "react";
import * as api from "../api";
import { CATEGORIES } from "../constants";
import PremiumLock from "../components/PremiumLock";

export default function AIAdvisorPage({ transactions, subs = [], goals = [], isPremium, onUpgrade }) {
  const [loading, setChatLoading2] = useState(false);
  const [advice, setAdvice]       = useState(null);
  const [chat, setChat]           = useState([]);
  const [input, setInput]         = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const expense    = transactions.filter(t => t.amount < 0);
  const byCat      = CATEGORIES.map(cat => ({
    label: cat.label,
    total: Math.abs(expense.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0))
  })).filter(c => c.total > 0);
  const totalSpend = byCat.reduce((s, c) => s + c.total, 0);
  const income     = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const balance    = income - totalSpend;

  // გამოწერები (მხოლოდ active)
  const activeSubs = subs
    .filter(s => s.active !== false)
    .map(s => ({ name: s.name, price: s.price, nextDate: s.nextDate, currency: s.currency || "₾" }));

  // განმეორებადი ტრანზაქციები (unique by desc)
  const recurringMap = new Map();
  transactions.filter(t => t.recurring).forEach(t => {
    if (!recurringMap.has(t.desc)) recurringMap.set(t.desc, t);
  });
  const recurringList = Array.from(recurringMap.values()).map(t => ({
    desc: t.desc, amount: t.amount, freq: t.recFreq || "monthly"
  }));

  // მიზნები
  const goalsList = goals.map(g => ({
    name: g.name, target: g.target, saved: g.saved || g.current || 0, currency: g.currency || "₾"
  }));

  // ბიუჯეტი localStorage-დან
  const budgetsRaw = (() => { try { return JSON.parse(localStorage.getItem("moneyka_budgets") || "{}"); } catch { return {}; } })();
  const budgetsList = Object.entries(budgetsRaw)
    .filter(([, v]) => parseFloat(v) > 0)
    .map(([catId, v]) => {
      const cat = CATEGORIES.find(c => c.id === catId);
      return { category: cat ? cat.label : catId, monthlyBudget: parseFloat(v) };
    });

  // სრული კონტექსტი ყველა request-ისთვის
  const userContext = { byCat, totalSpend, income, balance, subs: activeSubs, goals: goalsList, budgets: budgetsList, recurring: recurringList };

  // ── Free plan AI quota: 3 კითხვა/დღე ──────────────────────────────────────
  const FREE_DAILY_LIMIT = 3;
  function getAiUsage() {
    try {
      const raw = JSON.parse(localStorage.getItem("mk_ai_usage") || "{}");
      const today = new Date().toISOString().slice(0, 10);
      if (raw.date !== today) return { date: today, count: 0 };
      return raw;
    } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
  }
  function incrementAiUsage() {
    const u = getAiUsage();
    localStorage.setItem("mk_ai_usage", JSON.stringify({ date: u.date, count: u.count + 1 }));
  }
  const aiUsage    = getAiUsage();
  const aiLeft     = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - aiUsage.count);
  const aiExhausted = !isPremium && aiLeft === 0;

  function isApiError(text) {
    return text && (
      text.startsWith("AI შეცდომა:") ||
      text.startsWith("კავშირის შეცდომა:") ||
      text.includes("API key") ||
      text.includes("არ არის კონფიგურირებული")
    );
  }

  const AI_DOWN_MSG = "⚠️ AI სერვისი დროებით მიუწვდომელია. გთხოვ სცადე მოგვიანებით.";

  async function getAdvice() {
    if (aiExhausted) return;
    setChatLoading2(true);
    incrementAiUsage();
    try {
      const data = await api.getAdvice(userContext);
      setAdvice(isApiError(data.text) ? AI_DOWN_MSG : data.text);
    } catch {
      setAdvice(AI_DOWN_MSG);
    }
    setChatLoading2(false);
  }

  async function sendChat() {
    if (!input.trim() || aiExhausted) return;
    const userMsg = input.trim();
    setInput("");
    const newChat = [...chat, { role: "user", text: userMsg }];
    setChat(newChat);
    setChatLoading(true);
    incrementAiUsage();
    try {
      const messages = newChat.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const data = await api.sendChat({ messages, ...userContext });
      const reply = isApiError(data.text) ? AI_DOWN_MSG : data.text;
      setChat(c => [...c, { role: "assistant", text: reply }]);
    } catch {
      setChat(c => [...c, { role: "assistant", text: AI_DOWN_MSG }]);
    }
    setChatLoading(false);
  }

  // Free quota banner (shown instead of hard lock)
  const quotaBanner = !isPremium && (
    <div onClick={aiExhausted ? onUpgrade : undefined} style={{
      background: aiExhausted ? "rgba(167,139,250,0.12)" : "rgba(76,175,130,0.08)",
      border: `1px solid ${aiExhausted ? "rgba(167,139,250,0.3)" : "rgba(76,175,130,0.25)"}`,
      borderRadius: 16, padding: "12px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      cursor: aiExhausted ? "pointer" : "default"
    }}>
      <div>
        <p style={{ color: aiExhausted ? "#A78BFA" : "#4CAF82", fontWeight: 600, fontSize: 13 }}>
          {aiExhausted ? "🔒 დღიური ლიმიტი ამოიწურა" : `✨ ${aiLeft}/${FREE_DAILY_LIMIT} უფასო კითხვა დარჩა დღეს`}
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
          {aiExhausted ? "Pro-ზე — ულიმიტო კითხვები · 1.49₾/თვე" : "ხვალ განახლდება · Pro-ზე ულიმიტო"}
        </p>
      </div>
      {aiExhausted && <span style={{ color: "#A78BFA", fontSize: 18 }}>›</span>}
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a0d3a,#0d0d2e)", borderRadius: 20, padding: "18px",
        marginBottom: 20, border: "1px solid rgba(167,139,250,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(167,139,250,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>AI ფინანსური მრჩეველი</p>
            <p style={{ color: "rgba(167,139,250,0.7)", fontSize: 11 }}>powered by OpenAI GPT-4o mini</p>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
          პიროვნული ფინანსური რჩევები შენი ხარჯების მიხედვით
        </p>
      </div>

      {quotaBanner}

      {/* Quick Analysis */}
      {!advice && (
        <button onClick={getAdvice} disabled={loading || aiExhausted} style={{
          width: "100%", background: aiExhausted ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#A78BFA,#7C3AED)",
          border: aiExhausted ? "1px solid rgba(255,255,255,0.1)" : "none",
          borderRadius: 16, padding: "16px", color: aiExhausted ? "rgba(255,255,255,0.3)" : "#fff",
          fontWeight: 700, fontSize: 15, cursor: aiExhausted ? "default" : "pointer", fontFamily: "inherit",
          marginBottom: 20, opacity: loading ? 0.7 : 1,
          boxShadow: aiExhausted ? "none" : "0 6px 20px rgba(124,58,237,0.4)"
        }}>
          {loading ? "⏳ ანალიზდება..." : aiExhausted ? "🔒 ლიმიტი ამოიწურა" : "✨ ჩემი ხარჯების ანალიზი"}
        </button>
      )}

      {advice && (
        <div style={{ background: "linear-gradient(135deg,#1a0d3a,#110a28)", borderRadius: 20, padding: "18px",
          marginBottom: 20, border: "1px solid rgba(167,139,250,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14 }}>✨ AI რჩევა</p>
            <button onClick={() => setAdvice(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16 }}>↺</button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{advice}</p>
        </div>
      )}

      {/* Chat */}
      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>💬 კითხვა-პასუხი</p>

      {chat.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {["როგორ დავზოგო მეტი?", "სად ვხარჯავ ყველაზე მეტს?", "გამიკეთე 3 თვის გეგმა"].map(q => (
            <button key={q} onClick={() => setInput(q)} style={{
              background: "#1a2e22", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 14,
              padding: "12px 16px", color: "rgba(255,255,255,0.7)", fontSize: 13,
              cursor: "pointer", textAlign: "left", fontFamily: "inherit"
            }}>💬 {q}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", borderRadius: 16, padding: "12px 14px",
              background: m.role === "user" ? "linear-gradient(135deg,#A78BFA,#7C3AED)" : "#1a2e22",
              border: m.role === "assistant" ? "1px solid rgba(167,139,250,0.15)" : "none",
              borderBottomRightRadius: m.role === "user" ? 4 : 16,
              borderBottomLeftRadius:  m.role === "assistant" ? 4 : 16,
            }}>
              <p style={{ color: "#fff", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex" }}>
            <div style={{ background: "#1a2e22", borderRadius: 16, borderBottomLeftRadius: 4, padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA",
                    animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input value={input} onChange={e => !aiExhausted && setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChat()}
          placeholder={aiExhausted ? "ლიმიტი ამოიწურა..." : "შეკითხვა..."}
          disabled={aiExhausted}
          style={{
            flex: 1, background: "#1a2e22", border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: 14, padding: "12px 14px", color: aiExhausted ? "rgba(255,255,255,0.3)" : "#fff", fontSize: 14,
            outline: "none", fontFamily: "inherit"
          }} />
        <button onClick={sendChat} style={{
          background: "linear-gradient(135deg,#A78BFA,#7C3AED)", border: "none",
          borderRadius: 14, padding: "12px 16px", color: "#fff", cursor: "pointer", fontSize: 18
        }}>→</button>
      </div>
    </div>
  );
}
