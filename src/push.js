const API = "http://localhost:5141/api";

// VAPID public key (base64url → Uint8Array)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function registerPush(deviceId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    // 1. register SW
    const reg = await navigator.serviceWorker.register("/sw.js");

    // 2. request notification permission
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;

    // 3. get VAPID public key from backend
    const res    = await fetch(`${API}/push/vapid-public`);
    const { key } = await res.json();

    // 4. subscribe to push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });

    const json   = sub.toJSON();
    const p256dh = json.keys?.p256dh || "";
    const auth   = json.keys?.auth   || "";

    // 5. send subscription to backend
    await fetch(`${API}/push/subscribe`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ deviceId, endpoint: sub.endpoint, p256dh, auth })
    });

    return true;
  } catch (e) {
    console.error("Push registration failed:", e);
    return false;
  }
}

export async function unregisterPush(deviceId) {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch(`${API}/push/unsubscribe/${deviceId}`, { method: "DELETE" });
  } catch {}
}
