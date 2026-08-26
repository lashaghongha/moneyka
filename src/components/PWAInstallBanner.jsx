import { useState, useEffect } from "react";
import {
  onInstallPromptChange, hasInstallPrompt, triggerInstall,
  isStandaloneMode, isIOS as detectIOS
} from "../installPrompt";

/**
 * bottom banner — ჩნდება ავტომატურად Chrome-ის prompt-ზე ან iOS-ზე.
 * install logic shared installPrompt.js-ში.
 */
export default function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(() => hasInstallPrompt());
  const [show, setShow]            = useState(false);
  const [ios, setIos]              = useState(false);
  const [dismissed, setDismissed]  = useState(
    () => !!localStorage.getItem("pwa_banner_dismissed")
  );

  useEffect(() => {
    if (isStandaloneMode() || dismissed) return;

    // iOS manual instruction (3s delay)
    if (detectIOS()) {
      setIos(true);
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome — prompt event-ზე ველოდებით
    const unsub = onInstallPromptChange((available) => {
      setCanInstall(available);
      if (available) setShow(true);
    });
    if (hasInstallPrompt()) setShow(true);
    return unsub;
  }, [dismissed]);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa_banner_dismissed", "1");
  }

  async function install() {
    const accepted = await triggerInstall();
    if (accepted) dismiss();
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
      <div style={{ fontSize: 32, flexShrink: 0 }}>₾</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 700 }}>
          MoneyKa-ს ინსტალაცია
        </p>
        {ios ? (
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
            Share → <strong style={{ color: "#4CAF82" }}>Add to Home Screen</strong>
          </p>
        ) : (
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
            დააინსტალირე სწრაფი წვდომისთვის
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {!ios && canInstall && (
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
