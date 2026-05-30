import { useState } from "react";
import { auth } from "../storage";

const PIN_LEN = 4;

function PhoneInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <div style={{
        background: "#0d1f16", border: "1px solid rgba(76,175,82,0.25)",
        borderRadius: 12, padding: "14px 12px",
        color: "#4CAF82", fontWeight: 700, fontSize: 15, flexShrink: 0,
        display: "flex", alignItems: "center"
      }}>+995</div>
      <input
        type="tel" inputMode="numeric" maxLength={9}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
        placeholder="5XX XXX XXX"
        style={{
          flex: 1, background: "#0d1f16",
          border: "1px solid rgba(76,175,82,0.25)",
          borderRadius: 12, padding: "14px 14px",
          color: "#fff", fontSize: 18, outline: "none",
          fontFamily: "inherit", letterSpacing: 2
        }}
      />
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const isReg = auth.isRegistered();

  // mode: "login" | "register" | "forgot"
  const [mode, setMode]   = useState(isReg ? "login" : "register");
  // register steps: "name" → "phone" → "pin" → "pin2"
  // forgot steps:   "phone" → "pin" → "pin2"
  const [step, setStep]   = useState(isReg ? "pin" : "name");

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin]     = useState("");
  const [pin2, setPin2]   = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 500); }
  function clearErr()     { setError(""); }

  function goMode(m, s = "name") {
    setMode(m); setStep(s);
    setName(""); setPhone(""); setPin(""); setPin2(""); clearErr();
  }

  // ── PIN keypad ─────────────────────────────────────────────────────────────
  function pressKey(k) {
    clearErr();
    const isSecond = step === "pin2";
    const target   = isSecond ? pin2 : pin;
    const setFn    = isSecond ? setPin2 : setPin;

    if (k === "⌫") { setFn(v => v.slice(0, -1)); return; }
    if (target.length >= PIN_LEN) return;
    const next = target + k;
    setFn(next);
    if (next.length === PIN_LEN) setTimeout(() => handlePinComplete(next), 120);
  }

  async function handlePinComplete(entered) {
    clearErr();

    // ── login ──
    if (mode === "login") {
      const ok = await auth.login(entered);
      if (ok) { onAuth(); return; }
      setError("არასწორი PIN კოდი");
      setPin(""); triggerShake(); return;
    }

    // ── register ──
    if (mode === "register") {
      if (step === "pin")  { setStep("pin2"); return; }
      if (step === "pin2") {
        if (entered !== pin) {
          setError("PIN კოდები არ ემთხვევა"); setPin(""); setPin2(""); setStep("pin"); triggerShake(); return;
        }
        await auth.register(name.trim() || "მომხმარებელი", "+995" + phone, entered);
        onAuth(); return;
      }
    }

    // ── forgot ──
    if (mode === "forgot") {
      if (step === "pin")  { setStep("pin2"); return; }
      if (step === "pin2") {
        if (entered !== pin) {
          setError("PIN კოდები არ ემთხვევა"); setPin(""); setPin2(""); setStep("pin"); triggerShake(); return;
        }
        await auth.setNewPin(auth.getName(), entered);
        onAuth(); return;
      }
    }
  }

  // ── forgot: check phone ────────────────────────────────────────────────────
  function handleCheckPhone() {
    clearErr();
    if (phone.length < 9) { setError("სრული ნომერი შეიყვანე"); return; }
    const ok = auth.checkPhone(phone);
    if (ok) {
      auth.resetPin();   // PIN hash წაიშლება, მონაცემი რჩება
      setStep("pin");
    } else {
      setError("ეს ნომერი არ ემთხვევა რეგისტრაციის ნომერს");
      triggerShake();
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const headlines = {
    login_pin:      ["შესვლა",           `გამარჯობა, ${auth.getName()}!`],
    register_name:  ["რეგისტრაცია",      "შეიყვანე შენი სახელი"],
    register_phone: ["ტელეფონის ნომერი", "PIN-ის აღსადგენად გამოიყენება"],
    register_pin:   ["PIN კოდი",         "4-ნიშნა კოდი — გახსოვდეს!"],
    register_pin2:  ["გაიმეორე PIN",     "ისევ შეიყვანე დასადასტურებლად"],
    forgot_phone:   ["PIN-ის აღდგენა",   "შეიყვანე რეგისტრაციის ნომერი"],
    forgot_pin:     ["ახალი PIN",        "შეიყვანე ახალი 4-ნიშნა კოდი"],
    forgot_pin2:    ["გაიმეორე PIN",     "ისევ შეიყვანე"],
  };
  const hkey = `${mode}_${step}`;
  const [headline, sub] = headlines[hkey] || ["MoneyKa", ""];

  const showKeypad  = step === "pin" || step === "pin2";
  const currentPin  = step === "pin2" ? pin2 : pin;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a160f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px",
      fontFamily: "'BPG Nino Mkhedruli','Sylfaen',Georgia,serif",
      maxWidth: 390, margin: "0 auto"
    }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>

      {/* Logo */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: "linear-gradient(135deg,#1a3a2a,#0d2419)",
        border: "2px solid #4CAF8244",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 20, boxShadow: "0 8px 32px #4CAF8222"
      }}>₾</div>

      <h1 style={{ color: "#4CAF82", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>MoneyKa</h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 32px" }}>ჭკვიანი ფინანსური ასისტენტი</p>

      {/* Card */}
      <div style={{
        width: "100%", background: "#1a2e22", borderRadius: 24, padding: "28px 24px",
        border: "1px solid rgba(76,175,82,0.15)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)"
      }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px", textAlign: "center" }}>{headline}</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>{sub}</p>

        {/* ── Name ── */}
        {step === "name" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="შენი სახელი" autoFocus
              style={{ width: "100%", background: "#0d1f16",
                border: "1px solid rgba(76,175,82,0.25)", borderRadius: 14,
                padding: "15px 16px", color: "#fff", fontSize: 16, outline: "none",
                marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit" }} />
            <button onClick={() => { if (name.trim()) { setStep("phone"); clearErr(); } else setError("სახელი სავალდებულოა"); }}
              style={{ width: "100%", background: "linear-gradient(135deg,#4CAF82,#2d8f5a)", border: "none",
                borderRadius: 14, padding: "15px", color: "#fff", fontWeight: 700,
                fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              გაგრძელება →
            </button>
          </>
        )}

        {/* ── Phone (register or forgot) ── */}
        {step === "phone" && (
          <>
            {mode === "register" && (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
                ეს ნომერი PIN-ის დავიწყების შემთხვევაში დაგეხმარება. სერვერზე არ იგზავნება.
              </p>
            )}
            <PhoneInput value={phone} onChange={setPhone} />
            <button
              onClick={mode === "forgot" ? handleCheckPhone : () => {
                if (phone.length === 9) { setStep("pin"); clearErr(); }
                else setError("9-ნიშნა ნომერი შეიყვანე");
              }}
              style={{ width: "100%", background: "linear-gradient(135deg,#4CAF82,#2d8f5a)", border: "none",
                borderRadius: 14, padding: "15px", color: "#fff", fontWeight: 700,
                fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              {mode === "forgot" ? "შემოწმება" : "გაგრძელება →"}
            </button>
          </>
        )}

        {/* ── PIN keypad ── */}
        {showKeypad && (
          <>
            <div style={{
              display: "flex", justifyContent: "center", gap: 16, marginBottom: 28,
              animation: shake ? "shake 0.5s" : "none"
            }}>
              {Array.from({ length: PIN_LEN }).map((_, i) => (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: i < currentPin.length ? "#4CAF82" : "rgba(255,255,255,0.1)",
                  border: "2px solid",
                  borderColor: i < currentPin.length ? "#4CAF82" : "rgba(255,255,255,0.2)",
                  transition: "all 0.15s",
                  transform: i < currentPin.length ? "scale(1.15)" : "scale(1)"
                }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
                <button key={i} onClick={() => k && pressKey(k)} style={{
                  background: k ? "rgba(255,255,255,0.06)" : "transparent",
                  border: k ? "1px solid rgba(255,255,255,0.08)" : "none",
                  borderRadius: 14, padding: "18px 0",
                  color: "#fff", fontSize: k === "⌫" ? 18 : 22,
                  fontWeight: 600, cursor: k ? "pointer" : "default",
                  fontFamily: "inherit"
                }}>{k}</button>
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "#E05470", fontSize: 12, textAlign: "center", marginTop: 14, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 20, textAlign: "center", display: "flex", gap: 20, justifyContent: "center" }}>
        {mode === "login" && (
          <>
            <button onClick={() => goMode("forgot", "phone")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              PIN დამავიწყდა
            </button>
            <button onClick={() => goMode("register", "name")}
              style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              ახალი ანგარიში
            </button>
          </>
        )}
        {(mode === "register" || mode === "forgot") && isReg && (
          <button onClick={() => goMode("login", "pin")}
            style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ← შესვლაზე დაბრუნება
          </button>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, marginTop: 24, textAlign: "center" }}>
        🔒 ყველა მონაცემი მხოლოდ ამ მოწყობილობაზეა
      </p>
    </div>
  );
}
