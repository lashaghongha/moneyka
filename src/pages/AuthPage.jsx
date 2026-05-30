import { useState } from "react";
import { auth, getDeviceId } from "../storage";
import { checkPhone, loginWithPassword, pingUser } from "../api";

const PIN_LEN = 4;

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhoneInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <div style={{
        background: "#0d1f16", border: "1px solid rgba(76,175,82,0.25)",
        borderRadius: 12, padding: "14px 12px", color: "#4CAF82",
        fontWeight: 700, fontSize: 15, flexShrink: 0, display: "flex", alignItems: "center"
      }}>+995</div>
      <input
        type="tel" inputMode="numeric" maxLength={9}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
        placeholder="5XX XXX XXX"
        style={{
          flex: 1, background: "#0d1f16",
          border: "1px solid rgba(76,175,82,0.25)", borderRadius: 12,
          padding: "14px 14px", color: "#fff", fontSize: 18,
          outline: "none", fontFamily: "inherit", letterSpacing: 2
        }}
      />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "პაროლი", autoFocus = false }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: "100%", background: "#0d1f16",
          border: "1px solid rgba(76,175,82,0.25)", borderRadius: 14,
          padding: "15px 48px 15px 16px", color: "#fff", fontSize: 16,
          outline: "none", boxSizing: "border-box", fontFamily: "inherit"
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
          cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1
        }}
      >{show ? "🙈" : "👁"}</button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AuthPage({ onAuth }) {
  const isReg = auth.isRegistered();

  // mode: "register" | "login" | "recover"
  const [mode, setMode] = useState(isReg ? "login" : "register");
  // step: name | phone | password | password2 | pin | pin2
  const [step, setStep] = useState(isReg ? "pin" : "name");

  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [pin,       setPin]       = useState("");
  const [pin2,      setPin2]      = useState("");

  const [error,   setError]   = useState("");
  const [shake,   setShake]   = useState(false);
  const [sending, setSending] = useState(false);

  // recover mode: backend user data after successful password verify
  const [recoverData, setRecoverData] = useState(null);

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 500); }
  function clearErr()     { setError(""); }

  function goMode(m, s) {
    setMode(m); setStep(s);
    setName(""); setPhone(""); setPassword(""); setPassword2("");
    setPin(""); setPin2(""); clearErr(); setRecoverData(null);
  }

  // ── ტელეფონის შემოწმება ──────────────────────────────────────────────────────
  async function handlePhoneNext() {
    if (phone.length !== 9) { setError("9-ნიშნა ნომერი შეიყვანე"); return; }
    setSending(true); clearErr();
    try {
      const fullPhone = "+995" + phone;
      if (mode === "register") {
        const { exists } = await checkPhone(fullPhone);
        if (exists) { setError("ეს ნომერი უკვე დარეგისტრირებულია"); setSending(false); return; }
      }
      // recover mode: phone is just collected here, verification happens with password
      setStep("password");
    } catch {
      setError("კავშირის შეცდომა, სცადე ახლიდან");
    }
    setSending(false);
  }

  // ── პაროლის ნაბიჯი — register ───────────────────────────────────────────────
  function handlePasswordNext() {
    if (password.length < 6) { setError("მინიმუმ 6 სიმბოლო შეიყვანე"); return; }
    clearErr(); setStep("password2");
  }

  function handlePassword2Next() {
    if (password !== password2) {
      setError("პაროლები არ ემთხვევა"); setPassword2(""); triggerShake(); return;
    }
    clearErr(); setStep("pin");
  }

  // ── პაროლის ნაბიჯი — recover ────────────────────────────────────────────────
  async function handleRecoverVerify() {
    if (password.length < 1) { setError("პაროლი შეიყვანე"); return; }
    setSending(true); clearErr();
    try {
      const fullPhone    = "+995" + phone;
      const passwordHash = await auth.hashPassword(password);
      const data         = await loginWithPassword(fullPhone, passwordHash);
      setRecoverData(data);
      setStep("pin"); // ახალი PIN-ის დაყენება
    } catch {
      setError("ტელეფონი ან პაროლი არასწორია");
      triggerShake();
    }
    setSending(false);
  }

  // ── PIN keypad ───────────────────────────────────────────────────────────────
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

    // ── Login ──
    if (mode === "login") {
      const ok = await auth.login(entered);
      if (ok) { onAuth(); return; }
      setError("არასწორი PIN კოდი");
      setPin(""); triggerShake(); return;
    }

    // ── Register ──
    if (mode === "register") {
      if (step === "pin")  { setStep("pin2"); return; }
      if (step === "pin2") {
        if (entered !== pin) {
          setError("PIN კოდები არ ემთხვევა"); setPin(""); setPin2(""); setStep("pin"); triggerShake(); return;
        }
        const fullName  = name.trim() || "მომხმარებელი";
        const fullPhone = "+995" + phone;
        await auth.register(fullName, fullPhone, entered);
        // Backend-ი: მომხმარებელი + პაროლი ერთ ping-ში
        try {
          const passwordHash = await auth.hashPassword(password);
          await pingUser(getDeviceId(), "free", fullName, fullPhone, passwordHash);
        } catch {}
        onAuth(); return;
      }
    }

    // ── Recover ──
    if (mode === "recover") {
      if (step === "pin")  { setStep("pin2"); return; }
      if (step === "pin2") {
        if (entered !== pin) {
          setError("PIN კოდები არ ემთხვევა"); setPin(""); setPin2(""); setStep("pin"); triggerShake(); return;
        }
        if (recoverData) {
          auth.restoreFromBackend(recoverData.name, recoverData.phone, recoverData.deviceId, recoverData.plan);
        }
        await auth.setNewPin(recoverData?.name || "", entered);
        onAuth(); return;
      }
    }
  }

  // ── Headlines ────────────────────────────────────────────────────────────────
  const headlines = {
    login_pin:         ["შესვლა",              `გამარჯობა, ${auth.getName()}!`],
    register_name:     ["რეგისტრაცია",         "შეიყვანე შენი სახელი"],
    register_phone:    ["ტელეფონის ნომერი",    "ერთი ანგარიში — ერთი ნომერი"],
    register_password: ["პაროლი",              "მინიმუმ 6 სიმბოლო — გახსოვდეს!"],
    register_password2:["გაიმეორე პაროლი",     "ისევ შეიყვანე დასადასტურებლად"],
    register_pin:      ["PIN კოდი",            "4-ნიშნა კოდი — გახსოვდეს!"],
    register_pin2:     ["გაიმეორე PIN",        "ისევ შეიყვანე"],
    recover_phone:     ["ანგარიშის აღდგენა",   "შეიყვანე რეგისტრირებული ნომერი"],
    recover_password:  ["პაროლი",              "შეიყვანე შენი პაროლი"],
    recover_pin:       ["ახალი PIN",           "შეიყვანე ახალი 4-ნიშნა კოდი"],
    recover_pin2:      ["გაიმეორე PIN",        "ისევ შეიყვანე"],
  };
  const hkey = `${mode}_${step}`;
  const [headline, sub] = headlines[hkey] || ["MoneyKa", ""];
  const showKeypad = step === "pin" || step === "pin2";
  const currentPin = step === "pin2" ? pin2 : pin;

  // ── Render ───────────────────────────────────────────────────────────────────
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

      <div style={{
        width: "100%", background: "#1a2e22", borderRadius: 24, padding: "28px 24px",
        border: "1px solid rgba(76,175,82,0.15)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)"
      }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px", textAlign: "center" }}>{headline}</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>{sub}</p>

        {/* ── Name ── */}
        {step === "name" && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="შენი სახელი" autoFocus
              style={{ width: "100%", background: "#0d1f16", border: "1px solid rgba(76,175,82,0.25)",
                borderRadius: 14, padding: "15px 16px", color: "#fff", fontSize: 16,
                outline: "none", marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit" }} />
            <button onClick={() => { if (name.trim()) { setStep("phone"); clearErr(); } else setError("სახელი სავალდებულოა"); }}
              style={btnStyle}>გაგრძელება →</button>
          </>
        )}

        {/* ── Phone ── */}
        {step === "phone" && (
          <>
            <PhoneInput value={phone} onChange={setPhone} />
            <button onClick={handlePhoneNext} disabled={sending} style={{ ...btnStyle, opacity: sending ? 0.7 : 1 }}>
              {sending ? "⏳ შემოწმება..." : "გაგრძელება →"}
            </button>
          </>
        )}

        {/* ── Password (register) ── */}
        {step === "password" && mode === "register" && (
          <>
            <PasswordInput value={password} onChange={setPassword} autoFocus />
            <button onClick={handlePasswordNext} style={btnStyle}>გაგრძელება →</button>
          </>
        )}

        {/* ── Password2 (register confirm) ── */}
        {step === "password2" && (
          <>
            <PasswordInput value={password2} onChange={setPassword2} placeholder="გაიმეორე პაროლი" autoFocus />
            <button onClick={handlePassword2Next} style={btnStyle}>გაგრძელება →</button>
          </>
        )}

        {/* ── Password (recover verify) ── */}
        {step === "password" && mode === "recover" && (
          <>
            <PasswordInput value={password} onChange={setPassword} autoFocus />
            <button onClick={handleRecoverVerify} disabled={sending} style={{ ...btnStyle, opacity: sending ? 0.7 : 1 }}>
              {sending ? "⏳ შემოწმება..." : "შესვლა →"}
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
                  fontWeight: 600, cursor: k ? "pointer" : "default", fontFamily: "inherit"
                }}>{k}</button>
              ))}
            </div>
          </>
        )}

        {error && (
          <p style={{ color: "#E05470", fontSize: 12, textAlign: "center", marginTop: 14, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>

      {/* ── Bottom links ── */}
      <div style={{ marginTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        {mode === "login" && (
          <>
            <button onClick={() => goMode("recover", "phone")} style={linkStyle}>
              🔑 PIN დამავიწყდა / სხვა მოწყობილობა
            </button>
            <button onClick={() => goMode("register", "name")} style={{ ...linkStyle, color: "#4CAF82" }}>
              ახალი ანგარიში
            </button>
          </>
        )}
        {mode === "register" && (
          <button onClick={() => goMode("recover", "phone")} style={linkStyle}>
            უკვე ვარ დარეგისტრირებული →
          </button>
        )}
        {(mode === "register" || mode === "recover") && isReg && (
          <button onClick={() => goMode("login", "pin")} style={{ ...linkStyle, color: "#4CAF82" }}>
            ← PIN-ით შესვლა
          </button>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, marginTop: 24, textAlign: "center" }}>
        🔒 ყველა მონაცემი მხოლოდ ამ მოწყობილობაზეა
      </p>
    </div>
  );
}

const btnStyle = {
  width: "100%", background: "linear-gradient(135deg,#4CAF82,#2d8f5a)", border: "none",
  borderRadius: 14, padding: "15px", color: "#fff", fontWeight: 700,
  fontSize: 16, cursor: "pointer", fontFamily: "inherit"
};

const linkStyle = {
  background: "none", border: "none", color: "rgba(255,255,255,0.4)",
  fontSize: 13, cursor: "pointer", fontFamily: "inherit"
};
