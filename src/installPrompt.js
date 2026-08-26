/**
 * Shared PWA install prompt store.
 * beforeinstallprompt fires once — ვინახავთ module დონეზე
 * რომ ნებისმიერი კომპონენტი ისარგებლოს.
 */

let _prompt = null;
const _listeners = new Set();

export function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _prompt = e;
    _listeners.forEach(fn => fn(true));
  });
  window.addEventListener("appinstalled", () => {
    _prompt = null;
    _listeners.forEach(fn => fn(false));
  });
}

export function onInstallPromptChange(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function hasInstallPrompt() {
  return !!_prompt;
}

export async function triggerInstall() {
  if (!_prompt) return false;
  _prompt.prompt();
  const { outcome } = await _prompt.userChoice;
  if (outcome === "accepted") {
    _prompt = null;
    _listeners.forEach(fn => fn(false));
  }
  return outcome === "accepted";
}

export function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
