import { useState } from "react";
import * as api from "../api";
import { CATEGORIES } from "../constants";
import PremiumLock from "../components/PremiumLock";

export default function AIAdvisorPage({ transactions, isPremium, onUpgrade }) {
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

  async function getAdvice() {
    setChatLoading2(true);
    try {
      const data = await api.getAdvice({ byCat, totalSpend, income });
      setAdvice(data.text);
    } catch {
      setAdvice("კავშირის შეცდომა. სცადე მოგვიანებით.");
    }
    setChatLoading2(false);
  }

  async function sendChat() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newChat = [...chat, { role: "user", text: userMsg }];
    setChat(newChat);
    setChatLoading(true);
    try {
      const messages = newChat.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const data = await api.sendChat({ messages, byCat, totalSpend, income });
      setChat(c => [...c, { role: "assistant", text: data.text }]);
    } catch {
      setChat(c => [...c, { role: "assistant", text: "შეცდომა მოხდა. სცადე მოგვიანებით." }]);
    }
    setChatLoading(false);
  }

  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ filter: "blur(4px)", pointerEvents: "none", padding: "20px",
          background: "#1a2e22", borderRadius: 20 }}>
          <p style={{ color: "#A78BFA", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🤖 AI ფინანსური მრჩეველი</p>
          <div style={{ background: "rgba(167,139,250,0.1)", borderRadius: 16, padding: "16px", marginBottom: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>💡 შენი ხარჯების ანალიზი...</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>საკვებზე ბევრს ხარჯავ — სცადე...</p>
          </div>
        </div>
        <PremiumLock plan="Pro" onUpgrade={onUpgrade} />
      </div>
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
            <p style={{ color: "rgba(167,139,250,0.7)", fontSize: 11 }}>powered by Groq AI · უფასო</p>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
          პიროვნული ფინანსური რჩევები შენი ხარჯების მიხედვით
        </p>
      </div>

      {/* Quick Analysis */}
      {!advice && (
        <button onClick={getAdvice} disabled={loading} style={{
          width: "100%", background: "linear-gradient(135deg,#A78BFA,#7C3AED)",
          border: "none", borderRadius: 16, padding: "16px", color: "#fff",
          fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
          marginBottom: 20, opacity: loading ? 0.7 : 1,
          boxShadow: "0 6px 20px rgba(124,58,237,0.4)"
        }}>
          {loading ? "⏳ ანალიზდება..." : "✨ ჩემი ხარჯების ანალიზი"}
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
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChat()}
          placeholder="შეკითხვა..."
          style={{
            flex: 1, background: "#1a2e22", border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: 14, padding: "12px 14px", color: "#fff", fontSize: 14,
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
