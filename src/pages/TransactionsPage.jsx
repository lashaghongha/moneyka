import { useState } from "react";
import TxRow from "../components/TxRow";

export default function TransactionsPage({ transactions, setTransactions, cur = "₾" }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = transactions
    .filter(t => filter === "all" || (filter === "income" ? t.amount > 0 : t.amount < 0))
    .filter(t => !search || t.desc.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = filtered.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  function handleDelete(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  ძებნა..."
        style={{ width: "100%", background: "#1a2e22", border: "1px solid rgba(76,175,82,0.15)",
          borderRadius: 14, padding: "12px 16px", color: "#fff", fontSize: 14,
          outline: "none", marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit" }} />

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["all", "ყველა"], ["expense", "გასავალი"], ["income", "შემოსავალი"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            background: filter === v ? "#4CAF82" : "#1a2e22",
            color: filter === v ? "#fff" : "rgba(255,255,255,0.5)",
            fontWeight: filter === v ? 700 : 400, fontSize: 13, fontFamily: "inherit"
          }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 40, fontSize: 14 }}>
          ჩანაწერი არ მოიძებნა
        </p>
      )}

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8, paddingLeft: 4 }}>
            {new Date(date + "T12:00:00").toLocaleDateString("ka-GE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {txs.map(tx => (
              <TxRow key={tx.id} tx={tx} cur={cur} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
