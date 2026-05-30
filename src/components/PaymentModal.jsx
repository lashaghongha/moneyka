import { useState } from "react";

const METHODS = [
  { id: "bog", label: "საქ. ბანკი", short: "BOG", color: "#E31837", logo: "🏦" },
  { id: "tbc", label: "თიბისი",     short: "TBC", color: "#00AEEF", logo: "🏦" },
  { id: "apple", label: "Apple Pay", short: "Apple Pay", color: "#fff", logo: "🍎" },
];

function formatCard(v) {
  return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
}
function formatExpiry(v) {
  const d = v.replace(/\D/g,"").slice(0,4);
  return d.length > 2 ? d.slice(0,2) + "/" + d.slice(2) : d;
}

export default function PaymentModal({ plan, price, billing, onSuccess, onClose }) {
  const [method, setMethod]   = useState("bog");
  const [card,   setCard]     = useState("");
  const [name,   setName]     = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvv,    setCvv]      = useState("");
  const [loading, setLoading] = useState(false);
  const [step,   setStep]     = useState("form"); // "form" | "processing" | "success"
  const [error,  setError]    = useState("");

  const planColor = plan === "elite" ? "#F59E0B" : "#A78BFA";
  const yearly    = billing === "yearly";
  const total     = yearly ? (price * 12 * 0.6).toFixed(2) : price.toFixed(2);
  const period    = yearly ? "წელი" : "თვე";

  async function handleApplePay() {
    if (!window.PaymentRequest) {
      setError("Apple Pay ამ მოწყობილობაზე მიუწვდომელია");
      return;
    }
    try {
      const req = new PaymentRequest(
        [{ supportedMethods: "https://apple.com/apple-pay",
           data: { version: 3, merchantIdentifier: "merchant.ge.moneyka",
                   merchantCapabilities: ["supports3DS"],
                   supportedNetworks: ["visa","masterCard","amex"],
                   countryCode: "GE" } }],
        { total: { label: `MoneyKa ${plan === "elite" ? "Elite" : "Pro"}`, amount: { currency: "GEL", value: total } },
          displayItems: [{ label: `${plan === "elite" ? "Elite" : "Pro"} პაკეტი`, amount: { currency: "GEL", value: total } }] }
      );
      const canPay = await req.canMakePayment();
      if (!canPay) { setError("Apple Pay ხელმიუწვდომელია. სცადე სხვა მეთოდი."); return; }
      const result = await req.show();
      await result.complete("success");
      doSuccess();
    } catch (e) {
      if (e.name !== "AbortError") setError("Apple Pay შეცდომა: " + e.message);
    }
  }

  function validate() {
    const rawCard = card.replace(/\s/g,"");
    if (rawCard.length < 16)  { setError("ბარათის ნომერი არასრულია"); return false; }
    if (!name.trim())          { setError("მფლობელის სახელი შეიყვანე"); return false; }
    const [mm, yy] = expiry.split("/");
    const now = new Date();
    if (!mm || !yy || +mm > 12 || +mm < 1) { setError("ვადა არასწორია"); return false; }
    if (+yy + 2000 < now.getFullYear() || (+yy + 2000 === now.getFullYear() && +mm < now.getMonth() + 1))
      { setError("ბარათის ვადა გასულია"); return false; }
    if (cvv.length < 3)        { setError("CVV არასწორია"); return false; }
    return true;
  }

  function doSuccess() {
    setStep("success");
    setTimeout(() => onSuccess(), 1800);
  }

  async function handlePay() {
    setError("");
    if (method === "apple") { handleApplePay(); return; }
    if (!validate()) return;

    setLoading(true);
    setStep("processing");

    // Simulate bank redirect + confirmation (2s)
    // In production: POST to /api/payments/{method}/create → redirect to bank page
    await new Promise(r => setTimeout(r, 2000));

    setLoading(false);
    doSuccess();
  }

  const inputStyle = {
    width: "100%", background: "#0d1f16",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "13px 14px",
    color: "#fff", fontSize: 15, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
    marginBottom: 10,
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success") return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: "#4CAF82", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>გადახდა დასრულდა!</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          {plan === "elite" ? "👑 Elite" : "⭐ Pro"} პაკეტი გააქტიურდა
        </p>
      </div>
    </div>
  );

  // ── Processing screen ─────────────────────────────────────────────────────
  if (step === "processing") return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite" }}>⏳</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>მუშავდება...</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>გადახდა მიმდინარეობს</p>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>გადახდა</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "3px 0 0" }}>
              {plan === "elite" ? "👑 Elite" : "⭐ Pro"} ·{" "}
              <span style={{ color: planColor, fontWeight: 700 }}>{total} ₾/{period}</span>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            width: 32, height: 32, color: "rgba(255,255,255,0.5)", fontSize: 16,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
        </div>

        {/* Payment method tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {METHODS.map(m => (
            <button key={m.id} onClick={() => { setMethod(m.id); setError(""); }} style={{
              flex: 1, padding: "10px 6px", borderRadius: 12, cursor: "pointer",
              border: method === m.id ? `2px solid ${m.color}` : "2px solid rgba(255,255,255,0.08)",
              background: method === m.id ? m.color + "18" : "#0d1f16",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 18 }}>{m.logo}</span>
              <span style={{
                color: method === m.id ? m.color : "rgba(255,255,255,0.45)",
                fontSize: 10, fontWeight: method === m.id ? 700 : 400, fontFamily: "inherit"
              }}>{m.short}</span>
            </button>
          ))}
        </div>

        {/* BOG / TBC card form */}
        {(method === "bog" || method === "tbc") && (
          <>
            <div style={{
              background: method === "bog" ? "rgba(227,24,55,0.08)" : "rgba(0,174,239,0.08)",
              border: `1px solid ${method === "bog" ? "rgba(227,24,55,0.2)" : "rgba(0,174,239,0.2)"}`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>
                {method === "bog" ? "საქართველოს ბანკის" : "თიბისი ბანკის"} დაცული გადახდის გვერდი
              </p>
            </div>

            {/* Card number */}
            <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "block", marginBottom: 4 }}>ბარათის ნომერი</label>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                value={card} onChange={e => setCard(formatCard(e.target.value))}
                placeholder="0000 0000 0000 0000" inputMode="numeric"
                style={{ ...inputStyle, marginBottom: 0, paddingRight: 50, letterSpacing: 2 }}
              />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>
                {card.startsWith("4") ? "💳" : card.startsWith("5") ? "💳" : "💳"}
              </span>
            </div>

            {/* Name */}
            <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "block", marginBottom: 4 }}>ბარათის მფლობელი</label>
            <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
              placeholder="GIORGI MCHEDLISHVILI"
              style={{ ...inputStyle, letterSpacing: 1 }} />

            {/* Expiry + CVV */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "block", marginBottom: 4 }}>ვადა</label>
                <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY" inputMode="numeric" maxLength={5}
                  style={{ ...inputStyle, marginBottom: 0, textAlign: "center", letterSpacing: 3 }} />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, display: "block", marginBottom: 4 }}>CVV</label>
                <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                  placeholder="•••" inputMode="numeric" type="password" maxLength={4}
                  style={{ ...inputStyle, marginBottom: 0, textAlign: "center", letterSpacing: 6 }} />
              </div>
            </div>
          </>
        )}

        {/* Apple Pay */}
        {method === "apple" && (
          <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🍎</div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 6 }}>
              Touch ID ან Face ID-ით სწრაფი გადახდა
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 16 }}>
              Safari + iPhone/Mac საჭიროა
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "#E05470", fontSize: 12, margin: "8px 0 10px", fontWeight: 600 }}>⚠️ {error}</p>
        )}

        {/* Pay button */}
        <button onClick={handlePay} disabled={loading} style={{
          width: "100%", border: "none", borderRadius: 14, padding: "16px",
          color: method === "apple" ? "#000" : "#fff",
          fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", marginTop: 6,
          background: method === "bog"
            ? "linear-gradient(135deg,#E31837,#b01028)"
            : method === "tbc"
              ? "linear-gradient(135deg,#00AEEF,#0080b0)"
              : "#fff",
          boxShadow: method === "bog"
            ? "0 8px 24px rgba(227,24,55,0.4)"
            : method === "tbc"
              ? "0 8px 24px rgba(0,174,239,0.4)"
              : "0 8px 24px rgba(255,255,255,0.25)",
          opacity: loading ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {method === "apple" ? <><span style={{ fontSize: 18 }}>🍎</span> Pay with Apple Pay</>
            : <>გადახდა — {total} ₾</>}
        </button>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 12 }}>
          🔒 დაცული SSL გადახდა · PCI DSS სტანდარტი
        </p>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  zIndex: 1000, backdropFilter: "blur(4px)"
};
const modalStyle = {
  width: "100%", maxWidth: 390,
  background: "#112219",
  borderRadius: "24px 24px 0 0",
  padding: "24px 20px 40px",
  border: "1px solid rgba(76,175,82,0.15)",
  maxHeight: "90vh", overflowY: "auto"
};
