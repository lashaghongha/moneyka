// ─── Device ID ───────────────────────────────────────────────────────────────
export function getDeviceId() {
  let id = localStorage.getItem("moneyka_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("moneyka_device_id", id);
  }
  return id;
}

// ─── Generic localStorage helpers ────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


// ─── Hash helpers ─────────────────────────────────────────────────────────────
async function sha256(prefix, value) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(prefix + value));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const hashPin      = (pin)      => sha256("moneyka:",      pin);
const hashPassword = (password) => sha256("moneyka:pwd:",  password);


// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const auth = {
  isRegistered: () => !!localStorage.getItem("moneyka_pin_hash"),

  register: async (name, phone, pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem("moneyka_pin_hash",  hash);
    localStorage.setItem("moneyka_user_name", name);
    localStorage.setItem("moneyka_user_phone", phone);
    sessionStorage.setItem("moneyka_session", "1");
  },

  hashPassword,

  getPhone: () => localStorage.getItem("moneyka_user_phone") || "",

  login: async (pin) => {
    const stored = localStorage.getItem("moneyka_pin_hash");
    const hash   = await hashPin(pin);
    if (hash === stored) {
      sessionStorage.setItem("moneyka_session", "1");
      return true;
    }
    return false;
  },

  logout: () => sessionStorage.removeItem("moneyka_session"),

  isLoggedIn: () => !!sessionStorage.getItem("moneyka_session"),

  getName: () => localStorage.getItem("moneyka_user_name") || "მომხმარებელი",

  changePin: async (oldPin, newPin) => {
    const stored  = localStorage.getItem("moneyka_pin_hash");
    const oldHash = await hashPin(oldPin);
    if (oldHash !== stored) return false;
    const newHash = await hashPin(newPin);
    localStorage.setItem("moneyka_pin_hash", newHash);
    return true;
  },

  // ახალი PIN-ის დაყენება
  setNewPin: async (name, pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem("moneyka_pin_hash", hash);
    if (name) localStorage.setItem("moneyka_user_name", name);
    sessionStorage.setItem("moneyka_session", "1");
  },

  // backend-იდან მოღებული მონაცემების ლოკალურად შენახვა (ახალი მოწყობილობა)
  restoreFromBackend: (name, phone, deviceId, plan) => {
    localStorage.setItem("moneyka_device_id",  deviceId);
    localStorage.setItem("moneyka_user_name",  name);
    localStorage.setItem("moneyka_user_phone", phone);
    localStorage.setItem("moneyka_plan",       plan);
  },

  // ყველაფერი იშლება
  resetAll: () => { localStorage.clear(); },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const storage = {
  getTransactions:  ()  => load("moneyka_tx",      []),
  saveTransactions: (v) => save("moneyka_tx",       v),

  getGoals:  ()  => load("moneyka_goals",  []),
  saveGoals: (v) => save("moneyka_goals",   v),

  getSubs:  ()  => load("moneyka_subs",   []),
  saveSubs: (v) => save("moneyka_subs",    v),

  getPlan:  ()  => localStorage.getItem("moneyka_plan") || "free",
  savePlan: (v) => localStorage.setItem("moneyka_plan", v),

  getBudgets:  ()  => load("moneyka_budgets", {}),
  saveBudgets: (v) => save("moneyka_budgets",  v),
};
