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

// ─── Initial seed data (first launch only) ───────────────────────────────────
const SEED_TRANSACTIONS = [
  { id: 1,  category: "food",          desc: "სუპერმარკეტი",       amount: -85,  date: "2026-05-25", time: "14:30", type: "expense", recurring: false },
  { id: 2,  category: "transport",     desc: "ბენზინი",             amount: -40,  date: "2026-05-25", time: "12:10", type: "expense", recurring: false },
  { id: 3,  category: "entertainment", desc: "რესტორანი",           amount: -60,  date: "2026-05-24", time: "20:45", type: "expense", recurring: false },
  { id: 4,  category: "utilities",     desc: "Netflix",             amount: -15,  date: "2026-05-24", time: "09:15", type: "expense", recurring: true, recFreq: "monthly" },
  { id: 5,  category: "salary",         desc: "ხელფასი",             amount: 2800, date: "2026-05-01", time: "10:00", type: "income",  recurring: true, recFreq: "monthly" },
  { id: 6,  category: "food",          desc: "ბაზრობა",            amount: -120, date: "2026-05-22", time: "11:00", type: "expense", recurring: false },
  { id: 7,  category: "health",        desc: "აფთიაქი",            amount: -35,  date: "2026-05-21", time: "16:20", type: "expense", recurring: false },
  { id: 8,  category: "utilities",     desc: "მობილური",           amount: -25,  date: "2026-05-20", time: "09:00", type: "expense", recurring: true, recFreq: "monthly" },
  { id: 9,  category: "education",     desc: "ონლაინ კურსი",       amount: -45,  date: "2026-05-18", time: "14:00", type: "expense", recurring: false },
  { id: 10, category: "transport",     desc: "მეტრო ბარათი",       amount: -20,  date: "2026-05-17", time: "08:30", type: "expense", recurring: false },
  { id: 11, category: "utilities",     desc: "Spotify",             amount: -8,   date: "2026-05-15", time: "09:00", type: "expense", recurring: true, recFreq: "monthly" },
  { id: 12, category: "freelance",      desc: "ფრილანს შემოსავალი", amount: 450,  date: "2026-05-10", time: "15:30", type: "income",  recurring: false },
];
const SEED_GOALS = [
  { id: 1, title: "შვებულება",        icon: "🌴", target: 5000, saved: 2500, color: "#4CAF82" },
  { id: 2, title: "ახალი ტელეფონი",  icon: "📱", target: 2000, saved: 1200, color: "#4A90D9" },
  { id: 3, title: "საგანგებო ფონდი", icon: "🛡️", target: 5000, saved: 3000, color: "#E07B54" },
];
const SEED_SUBS = [
  { id: 1, name: "Spotify",         icon: "🎵", color: "#1DB954", price: 8.99,  billing: "monthly", category: "მუსიკა",      nextDate: "2026-06-15", active: true },
  { id: 2, name: "YouTube Premium", icon: "▶️", color: "#FF0000", price: 13.99, billing: "monthly", category: "ვიდეო",       nextDate: "2026-06-10", active: true },
  { id: 3, name: "Netflix",         icon: "🎬", color: "#E50914", price: 15.99, billing: "monthly", category: "ვიდეო",       nextDate: "2026-06-24", active: true },
  { id: 4, name: "iCloud+",         icon: "☁️", color: "#4A90D9", price: 2.99,  billing: "monthly", category: "ღრუბელი",    nextDate: "2026-06-05", active: true },
  { id: 5, name: "Adobe Creative",  icon: "🎨", color: "#FF0000", price: 29.99, billing: "monthly", category: "შემოქმედება", nextDate: "2026-06-18", active: false },
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
// Simple hash — PIN is never stored in plain text
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("moneyka:" + pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const auth = {
  isRegistered: () => !!localStorage.getItem("moneyka_pin_hash"),

  register: async (name, phone, pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem("moneyka_pin_hash", hash);
    localStorage.setItem("moneyka_user_name", name);
    localStorage.setItem("moneyka_user_phone", phone);
    sessionStorage.setItem("moneyka_session", "1");
  },

  getPhone: () => localStorage.getItem("moneyka_user_phone") || "",

  checkPhone: (phone) => {
    const stored = localStorage.getItem("moneyka_user_phone") || "";
    const normalize = p => p.replace(/\D/g, "").replace(/^995/, "");
    return normalize(stored) === normalize(phone);
  },

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
    const stored = localStorage.getItem("moneyka_pin_hash");
    const oldHash = await hashPin(oldPin);
    if (oldHash !== stored) return false;
    const newHash = await hashPin(newPin);
    localStorage.setItem("moneyka_pin_hash", newHash);
    return true;
  },

  // მხოლოდ PIN და session იშლება — მონაცემი და ტელეფონი რჩება
  resetPin: () => {
    localStorage.removeItem("moneyka_pin_hash");
    localStorage.removeItem("moneyka_user_name");
    sessionStorage.removeItem("moneyka_session");
  },

  // ახალი PIN-ის დაყენება (OTP-ის გადამოწმების შემდეგ)
  setNewPin: async (name, pin) => {
    const buf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("moneyka:" + pin));
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
    localStorage.setItem("moneyka_pin_hash", hash);
    if (name) localStorage.setItem("moneyka_user_name", name);
    sessionStorage.setItem("moneyka_session", "1");
  },

  // ყველაფერი იშლება (პარამეტრების გვერდიდან)
  resetAll: () => {
    localStorage.clear();
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const storage = {
  getTransactions: () => load("moneyka_tx",   SEED_TRANSACTIONS),
  saveTransactions: (v) => save("moneyka_tx", v),

  getGoals: () => load("moneyka_goals",   SEED_GOALS),
  saveGoals: (v) => save("moneyka_goals", v),

  getSubs: () => load("moneyka_subs",   SEED_SUBS),
  saveSubs: (v) => save("moneyka_subs", v),

  getPlan: () => localStorage.getItem("moneyka_plan") || "free",
  savePlan: (v) => localStorage.setItem("moneyka_plan", v),

  getBudgets: () => load("moneyka_budgets", {}),
  saveBudgets: (v) => save("moneyka_budgets", v),
};
