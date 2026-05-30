import { useState } from "react";
import { PLANS } from "../constants";
import { auth } from "../storage";
import { requestPermission } from "../notifications";
import { registerPush, unregisterPush } from "../push";
import { getDeviceId } from "../storage";

// ─── small reusable toggle ────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 13, cursor: "pointer", flexShrink: 0,
      background: on ? "#4CAF82" : "rgba(255,255,255,0.15)",
      position: "relative", transition: "background 0.2s"
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s"
      }} />
    </div>
  );
}

// ─── expandable panel ─────────────────────────────────────────────────────────
function Panel({ children }) {
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 16px",
      background: "rgba(0,0,0,0.15)"
    }}>{children}</div>
  );
}

export default function ProfilePage({ plan, setPlan, setPage, onLogout, currency, onCurrencyChange, darkMode, onThemeChange, cur }) {
  const planInfo = PLANS.find(p => p.id === plan);

  // settings state
  const [notifOn,    setNotifOn]    = useState(() => localStorage.getItem("mk_notif") !== "0");
  const [subNotifOn, setSubNotifOn] = useState(() => localStorage.getItem("mk_notif_sub") !== "0");
  const [openPanel,  setOpenPanel]  = useState(null);

  // PIN change state
  const [oldPin,     setOldPin]     = useState("");
  const [newPin,     setNewPin]     = useState("");
  const [newPin2,    setNewPin2]    = useState("");
  const [pinMsg,     setPinMsg]     = useState("");

  // reset confirm
  const [confirmReset, setConfirmReset] = useState(false);

  function togglePanel(id) {
    setOpenPanel(v => v === id ? null : id);
    setPinMsg(""); setOldPin(""); setNewPin(""); setNewPin2("");
  }

  async function saveNotif(val) {
    if (val) {
      const ok = await registerPush(getDeviceId());
      if (!ok) return;
    } else {
      const bothOff = !subNotifOn;
      if (bothOff) unregisterPush(getDeviceId());
    }
    setNotifOn(val);
    localStorage.setItem("mk_notif", val ? "1" : "0");
  }

  async function saveSubNotif(val) {
    if (val) {
      const ok = await registerPush(getDeviceId());
      if (!ok) return;
    } else {
      const bothOff = !notifOn;
      if (bothOff) unregisterPush(getDeviceId());
    }
    setSubNotifOn(val);
    localStorage.setItem("mk_notif_sub", val ? "1" : "0");
  }

  function saveCurrency(val) {
    onCurrencyChange(val);
    setOpenPanel(null);
  }

  async function handleChangePin() {
    if (oldPin.length < 4 || newPin.length < 4) { setPinMsg("PIN 4 ციფრი უნდა იყოს"); return; }
    if (newPin !== newPin2) { setPinMsg("ახალი PIN-ები არ ემთხვევა"); return; }
    const ok = await auth.changePin(oldPin, newPin);
    if (ok) { setPinMsg("✅ PIN წარმატებით შეიცვალა"); setOldPin(""); setNewPin(""); setNewPin2(""); }
    else    { setPinMsg("❌ ძველი PIN არასწორია"); }
  }

  function handleReset() {
    localStorage.clear();
    window.location.reload();
  }

  const CURRENCIES = [
    { id: "GEL", label: "ლარი",   sym: "₾" },
    { id: "USD", label: "დოლარი", sym: "$" },
    { id: "EUR", label: "ევრო",   sym: "€" },
    { id: "GBP", label: "ფუნტი",  sym: "£" },
  ];

  const pinInput = (val, setVal, placeholder) => (
    <input
      type="password" inputMode="numeric" maxLength={4}
      value={val} onChange={e => setVal(e.target.value.replace(/\D/g,"").slice(0,4))}
      placeholder={placeholder}
      style={{
        width: "100%", background: "#0d1f16", border: "1px solid rgba(76,175,82,0.2)",
        borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 18,
        letterSpacing: 6, outline: "none", boxSizing: "border-box",
        fontFamily: "inherit", marginBottom: 8
      }}
    />
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>

      {/* ── Avatar card ─────────────────────────────────────────────────────── */}
      <div style={{
        background: plan === "elite"
          ? "linear-gradient(135deg,#2a1a00,#1a1000)"
          : plan === "pro"
            ? "linear-gradient(135deg,#1a0d3a,#0d0d2e)"
            : "linear-gradient(135deg,#1a3a2a,#0d2419)",
        borderRadius: 20, padding: "24px", textAlign: "center", marginBottom: 20,
        border: `1px solid ${planInfo.color}33`
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `linear-gradient(135deg,${planInfo.color},${planInfo.color}88)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          margin: "0 auto 12px", border: `3px solid ${planInfo.color}44`
        }}>
          {plan === "elite" ? "👑" : plan === "pro" ? "⭐" : "👤"}
        </div>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, margin: 0 }}>{auth.getName()}</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "4px 0 10px" }}>
          🔒 მონაცემები მხოლოდ ამ მოწყობილობაზეა
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: `${planInfo.color}22`, borderRadius: 20, padding: "5px 14px",
          border: `1px solid ${planInfo.color}33`
        }}>
          <span style={{ color: planInfo.color, fontSize: 12 }}>
            {plan === "elite" ? "👑" : plan === "pro" ? "⭐" : "🆓"}
          </span>
          <span style={{ color: planInfo.color, fontWeight: 600, fontSize: 12 }}>{planInfo.name} პაკეტი</span>
        </div>
      </div>

      {/* ── Upgrade CTA ─────────────────────────────────────────────────────── */}
      {plan !== "elite" && (
        <div onClick={() => setPage("premium")} style={{
          background: plan === "pro" ? "linear-gradient(135deg,#2a1a00,#1a1000)" : "linear-gradient(135deg,#1a0d3a,#0d0d2e)",
          borderRadius: 20, padding: "18px", marginBottom: 20,
          border: `1px solid ${plan === "pro" ? "#F59E0B44" : "#A78BFA44"}`, cursor: "pointer"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: plan === "pro" ? "#F59E0B" : "#A78BFA", fontWeight: 700, fontSize: 15, margin: 0 }}>
                {plan === "pro" ? "👑 Elite-ზე გადასვლა" : "⭐ Pro-ზე გადასვლა"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0" }}>
                {plan === "pro" ? "7.99 ₾/თვე · ყველა ფუნქცია" : "3.99 ₾/თვე · AI + ექსპორტი"}
              </p>
            </div>
            <div style={{
              background: plan === "pro" ? "#F59E0B" : "#A78BFA",
              borderRadius: 12, padding: "10px 16px", color: "#fff", fontWeight: 700, fontSize: 13
            }}>→</div>
          </div>
        </div>
      )}

      {/* ── Plan features ────────────────────────────────────────────────────── */}
      <div style={{ background: "#1a2e22", borderRadius: 20, padding: "18px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>შენი პაკეტი მოიცავს:</p>
        {planInfo.features.filter(f => f.ok).map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: planInfo.color, fontSize: 13 }}>✓</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* ── Settings ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#1a2e22", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(76,175,82,0.1)", marginBottom: 20 }}>

        {/* შეტყობინებები */}
        <div>
          <div onClick={() => togglePanel("notif")} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", cursor: "pointer",
            borderBottom: openPanel === "notif" ? "none" : "1px solid rgba(255,255,255,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>🔔</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>შეტყობინებები</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{notifOn ? "ჩართულია" : "გამორთულია"}</p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{openPanel === "notif" ? "∨" : "›"}</span>
          </div>
          {openPanel === "notif" && (
            <Panel>
              {/* budget warning */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>ბიუჯეტის გაფრთხილება</p>
                <Toggle on={notifOn} onToggle={() => saveNotif(!notifOn)} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 16px" }}>
                შეტყობინება, როდესაც შემოსავლის 80%-ს გადააჭარბებ
              </p>
              {/* subscription reminder */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>გამოწერის შეხსენება</p>
                <Toggle on={subNotifOn} onToggle={() => saveSubNotif(!subNotifOn)} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
                წინა დღეს გაგაფრთხილებს — "ხვალ Spotify გადასახდელია"
              </p>
            </Panel>
          )}
        </div>

        {/* ვალუტა */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div onClick={() => togglePanel("currency")} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>💱</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>ვალუტა</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                  {CURRENCIES.find(c => c.id === currency)?.label} ({CURRENCIES.find(c => c.id === currency)?.sym})
                </p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{openPanel === "currency" ? "∨" : "›"}</span>
          </div>
          {openPanel === "currency" && (
            <Panel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CURRENCIES.map(c => (
                  <button key={c.id} onClick={() => saveCurrency(c.id)} style={{
                    background: currency === c.id ? "rgba(76,175,82,0.2)" : "rgba(255,255,255,0.05)",
                    border: currency === c.id ? "1.5px solid #4CAF82" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "10px", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span style={{ fontSize: 18 }}>{c.sym}</span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ color: currency === c.id ? "#4CAF82" : "#fff", fontSize: 13, margin: 0, fontWeight: currency === c.id ? 700 : 400 }}>{c.id}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{c.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* უსაფრთხოება — PIN შეცვლა */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div onClick={() => togglePanel("security")} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>🔒</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>უსაფრთხოება</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>PIN კოდის შეცვლა</p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{openPanel === "security" ? "∨" : "›"}</span>
          </div>
          {openPanel === "security" && (
            <Panel>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 10px" }}>PIN კოდის შეცვლა</p>
              {pinInput(oldPin, setOldPin, "ძველი PIN")}
              {pinInput(newPin, setNewPin, "ახალი PIN")}
              {pinInput(newPin2, setNewPin2, "გაიმეორე ახალი PIN")}
              {pinMsg && (
                <p style={{ color: pinMsg.startsWith("✅") ? "#4CAF82" : "#E05470", fontSize: 12, margin: "4px 0 8px" }}>{pinMsg}</p>
              )}
              <button onClick={handleChangePin} style={{
                width: "100%", background: "#4CAF82", border: "none", borderRadius: 10,
                padding: "11px", color: "#000", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit"
              }}>შენახვა</button>
            </Panel>
          )}
        </div>

        {/* თემა */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{darkMode ? "🌙" : "☀️"}</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>{darkMode ? "მუქი თემა" : "ღია თემა"}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                  {darkMode ? "გამორთვა = ღია თემა" : "ჩართვა = მუქი თემა"}
                </p>
              </div>
            </div>
            <Toggle on={darkMode} onToggle={() => onThemeChange(!darkMode)} />
          </div>
        </div>

        {/* დახმარება */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div onClick={() => togglePanel("help")} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>❓</span>
              <div>
                <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>დახმარება</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>FAQ, კონტაქტი</p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{openPanel === "help" ? "∨" : "›"}</span>
          </div>
          {openPanel === "help" && (
            <Panel>
              {[
                ["როგორ დავამატო ტრანზაქცია?", "ქვედა + ღილაკზე დააჭირე"],
                ["მონაცემები სად ინახება?", "მხოლოდ შენს ტელეფონში"],
                ["PIN დამავიწყდა?", "გამოსვლა > PIN დამავიწყდა"],
                ["კონტაქტი:", "support@moneyka.ge"],
              ].map(([q, a], i) => (
                <div key={i} style={{ marginBottom: i < 3 ? 12 : 0 }}>
                  <p style={{ color: "#4CAF82", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{q}</p>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0 }}>{a}</p>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>

      {/* ── Privacy note ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(76,175,82,0.06)", borderRadius: 16, padding: "14px 16px",
        marginBottom: 16, border: "1px solid rgba(76,175,82,0.15)",
        display: "flex", gap: 10, alignItems: "flex-start"
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔐</span>
        <div>
          <p style={{ color: "#4CAF82", fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>შენი კონფიდენციალობა</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            ყველა ფინანსური მონაცემი მხოლოდ ამ მოწყობილობაზე ინახება. სერვერზე არაფერი იგზავნება.
          </p>
        </div>
      </div>

      {/* ── Logout ───────────────────────────────────────────────────────────── */}
      <button onClick={onLogout} style={{
        width: "100%", background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
        padding: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14,
        cursor: "pointer", fontFamily: "inherit", marginBottom: 10
      }}>
        🔒 გამოსვლა (ჩაკეტვა)
      </button>

      {/* ── Reset ────────────────────────────────────────────────────────────── */}
      {!confirmReset ? (
        <button onClick={() => setConfirmReset(true)} style={{
          width: "100%", background: "rgba(224,84,112,0.08)",
          border: "1px solid rgba(224,84,112,0.25)", borderRadius: 16,
          padding: "14px", color: "#E05470", fontWeight: 600, fontSize: 14,
          cursor: "pointer", fontFamily: "inherit", marginBottom: 12
        }}>
          🗑️ მონაცემების გასუფთავება
        </button>
      ) : (
        <div style={{
          background: "rgba(224,84,112,0.1)", border: "1px solid rgba(224,84,112,0.3)",
          borderRadius: 16, padding: "16px", marginBottom: 12
        }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>დარწმუნებული ხარ?</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 16px" }}>
            ყველა ტრანზაქცია, მიზანი და გამოწერა წაიშლება. ეს მოქმედება შეუქცევადია.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmReset(false)} style={{
              flex: 1, background: "rgba(255,255,255,0.08)", border: "none",
              borderRadius: 12, padding: "12px", color: "rgba(255,255,255,0.6)",
              fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>გაუქმება</button>
            <button onClick={handleReset} style={{
              flex: 1, background: "#E05470", border: "none",
              borderRadius: 12, padding: "12px", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>წაშლა</button>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8 }}>
        MoneyKa v2.0 · Made with ❤️ in Georgia
      </p>
    </div>
  );
}
