import { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES } from "../constants";
import PremiumLock from "../components/PremiumLock";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ALL_CATS = [...CATEGORIES, ...INCOME_CATEGORIES];

function getPeriodTx(transactions, period) {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const pad   = n => String(n).padStart(2, "0");

  const thisMonth = `${y}-${pad(m + 1)}`;
  const lastMonth = m === 0
    ? `${y - 1}-12`
    : `${y}-${pad(m)}`;

  switch (period) {
    case 0: return transactions.filter(t => t.date?.startsWith(thisMonth));
    case 1: return transactions.filter(t => t.date?.startsWith(lastMonth));
    case 2: {
      const d = new Date(y, m - 2, 1);
      return transactions.filter(t => t.date >= `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`);
    }
    case 3: {
      const d = new Date(y, m - 5, 1);
      return transactions.filter(t => t.date >= `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`);
    }
    case 4: return transactions.filter(t => t.date?.startsWith(`${y}`));
    default: return transactions;
  }
}

export default function ExportPage({ transactions, isPremium, onUpgrade, cur = "₾" }) {
  const [exported, setExported] = useState(null);
  const [period,   setPeriod]   = useState(0);
  const [loading,  setLoading]  = useState(false);

  const periods = ["ეს თვე", "გასული თვე", "ბოლო 3 თვე", "ბოლო 6 თვე", "ეს წელი", "ყველა"];

  async function doExport(type) {
    setLoading(true);
    const txs = getPeriodTx(transactions, period).sort((a, b) => b.date.localeCompare(a.date));

    const rows = txs.map(t => ({
      date:     t.date,
      time:     t.time || "",
      category: ALL_CATS.find(c => c.id === t.category)?.label || t.category,
      desc:     t.desc,
      amount:   t.amount,
    }));

    if (type === "csv") {
      const header = "თარიღი,დრო,კატეგორია,აღწერა,თანხა\n";
      const body   = rows.map(r => `${r.date},${r.time},${r.category},${r.desc},${r.amount}`).join("\n");
      const blob   = new Blob(["﻿" + header + body], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, "moneyka.csv");
      setExported("CSV");

    } else if (type === "excel") {
      const data = [["თარიღი", "დრო", "კატეგორია", "აღწერა", "თანხა"],
        ...rows.map(r => [r.date, r.time, r.category, r.desc, r.amount])];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws["!cols"] = [{ wch: 12 }, { wch: 6 }, { wch: 16 }, { wch: 28 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MoneyKa");
      XLSX.writeFile(wb, "moneyka.xlsx");
      setExported("Excel");

    } else if (type === "pdf") {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // header
      doc.setFillColor(10, 22, 15);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(76, 175, 130);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("MoneyKa", 14, 14);
      doc.setFontSize(10);
      doc.setTextColor(180, 210, 190);
      doc.text(`${periods[period]} · ${txs.length} transaction`, 14, 22);

      // summary
      const income  = rows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
      const expense = rows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Income: ${income.toFixed(2)}${cur}   Expenses: ${expense.toFixed(2)}${cur}   Net: ${(income - expense).toFixed(2)}${cur}`, 14, 40);

      // table
      autoTable(doc, {
        startY: 46,
        head:   [["Date", "Time", "Category", "Description", "Amount"]],
        body:   rows.map(r => [r.date, r.time, r.category, r.desc,
          (r.amount > 0 ? "+" : "") + r.amount.toFixed(2) + cur]),
        styles:     { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [26, 46, 34], textColor: [76, 175, 130] },
        alternateRowStyles: { fillColor: [245, 250, 247] },
        columnStyles: { 4: { halign: "right" } },
      });

      doc.save("moneyka.pdf");
      setExported("PDF");
    }
    setLoading(false);
  }

  function triggerDownload(blob, name) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!isPremium) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ filter: "blur(3px)", pointerEvents: "none", background: "#1a2e22", padding: "20px", borderRadius: 20, minHeight: 200 }}>
          <p style={{ color: "#F59E0B", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📤 ექსპორტი</p>
          {["PDF ანგარიში", "Excel ცხრილი", "CSV ფაილი"].map(e => (
            <div key={e} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px", marginBottom: 8 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{e}</p>
            </div>
          ))}
        </div>
        <PremiumLock plan="Pro" onUpgrade={onUpgrade} />
      </div>
    </div>
  );

  const txCount = getPeriodTx(transactions, period).length;

  const formats = [
    { id: "csv",   icon: "📊", label: "CSV ფაილი",    sub: "Excel-ში გასახსნელი", col: "#4CAF82" },
    { id: "excel", icon: "📋", label: "Excel ცხრილი", sub: "სრული ანალიზით",      col: "#4A90D9" },
    { id: "pdf",   icon: "📄", label: "PDF ანგარიში", sub: "დასაბეჭდი ანგარიში",  col: "#E05470" },
  ];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ background: "linear-gradient(135deg,#1a2a0e,#0d1a0a)", borderRadius: 20,
        padding: "18px", marginBottom: 20, border: "1px solid rgba(76,175,82,0.15)" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>არჩეული პერიოდი</p>
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 28 }}>
          {txCount} <span style={{ color: "#4CAF82", fontSize: 16, fontWeight: 600 }}>ტრანზაქცია</span>
        </p>
      </div>

      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>პერიოდი</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {periods.map((p, i) => (
          <button key={i} onClick={() => { setPeriod(i); setExported(null); }} style={{
            padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: period === i ? "#4CAF82" : "#1a2e22",
            color: period === i ? "#fff" : "rgba(255,255,255,0.5)",
            fontWeight: period === i ? 700 : 400, fontSize: 13
          }}>{p}</button>
        ))}
      </div>

      <p style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>ფორმატი</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {formats.map(f => (
          <button key={f.id} onClick={() => doExport(f.id)} disabled={loading} style={{
            background: "#1a2e22", border: `1px solid ${f.col}22`, borderRadius: 16, padding: "16px",
            display: "flex", alignItems: "center", gap: 14, cursor: loading ? "default" : "pointer",
            textAlign: "left", width: "100%", opacity: loading ? 0.6 : 1
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: f.col + "22",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {f.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{f.label}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{f.sub}</p>
            </div>
            <span style={{ color: f.col, fontSize: 18 }}>{loading ? "⏳" : "↓"}</span>
          </button>
        ))}
      </div>

      {exported && (
        <div style={{ background: "rgba(76,175,82,0.12)", borderRadius: 16, padding: "14px 16px",
          border: "1px solid rgba(76,175,82,0.25)", textAlign: "center" }}>
          <p style={{ color: "#4CAF82", fontWeight: 700 }}>✅ {exported} წარმატებით ჩამოიტვირთა!</p>
        </div>
      )}
    </div>
  );
}
