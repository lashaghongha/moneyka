export default function PremiumNav({ page, setPage, plan, onUpgrade }) {
  const isPremium = plan !== "free";
  const isElite   = plan === "elite";

  const items = [
    { id: "ai",            icon: "🤖", label: "AI მრჩ.",   req: "pro"   },
    { id: "budget",        icon: "📊", label: "ბიუჯეტი",  req: "pro"   },
    { id: "subscriptions", icon: "💳", label: "გამოწ.",    req: "pro"   },
    { id: "recurring",     icon: "🔁", label: "განმეორ.",  req: "pro"   },
    { id: "export",        icon: "📤", label: "ექსპ.",     req: "pro"   },
    { id: "habits",        icon: "🧠", label: "ჩვევები",   req: "elite" },
  ];

  return (
    <div style={{
      display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px 6px",
      borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 0,
      scrollbarWidth: "none"
    }}>
      {items.map(item => {
        const unlocked = item.req === "pro" ? isPremium : isElite;
        const active   = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => unlocked ? setPage(item.id) : onUpgrade()}
            style={{
              padding: "10px 18px", borderRadius: 22, border: "none", cursor: "pointer", flexShrink: 0,
              background: active ? (item.req === "elite" ? "#F59E0B" : "#A78BFA") : "#1a2e22",
              color: active ? "#fff" : unlocked ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
              fontWeight: active ? 700 : 400, fontSize: 14, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
            {!unlocked && <span style={{ fontSize: 11 }}>🔒</span>}
          </button>
        );
      })}
    </div>
  );
}
