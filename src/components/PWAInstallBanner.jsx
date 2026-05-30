import { useState, useEffect } from "react";

/**
 * Shows "Install App" banner when the browser fires beforeinstallprompt.
 * On iOS shows a manual instruction (iOS doesn't support beforeinstallprompt).
 */
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow]                     = useState(false);
  const [isIOS, setIsIOS]                   = useState(false);
  const [dismissed, setDismissed]           = useState(
    () => !!localStorage.getItem("pwa_banner_dismissed")
  );

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const standalone = window.navigator.standalone === true;
    if (ios && !standalone && !dismissed) setIsIOS(true);

    // Android / Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  // Auto-show iOS banner after 3 s
  useEffect(() => {
    if (isIOS && !dismissed) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, [isIOS, dismissed]);

  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa_banner_dismissed", "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    else setDeferredPrompt(null);
  }

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 358,
      background: "linear-gradient(135deg,#1a3a2a,#0d2419)",
      border: "1px solid #4CAF8244",
      borderRadius: 16, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      zIndex: 9999, boxShadow: "0 8px 32px #00000066"
    }}>
      <div style={{ fontSize: 36, flexShrink: 0 }}>₾</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 700 }}>
          MoneyKa-ს ინსტალაცია
        </p>
        {isIOS ? (
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
            გახსენი Safari → <strong style={{ color: "#4CAF82" }}>Share</strong> → <strong style={{ color: "#4CAF82" }}>Add to Home Screen</strong>
          </p>
        ) : (
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
            დააინსტალირე სწრაფი წვდომისთვის
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={install} style={{
            background: "#4CAF82", color: "#000", border: "none",
            borderRadius: 8, padding: "6px 12px", fontSize: 12,
            fontWeight: 700, cursor: "pointer"
          }}>
            ინსტალაცია
          </button>
        )}
        <button onClick={dismiss} style={{
          background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)",
          border: "none", borderRadius: 8, padding: "6px 10px",
          fontSize: 12, cursor: "pointer"
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
