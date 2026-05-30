const BASE = import.meta.env.VITE_API_URL ?? (
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://moneyka-api-production.up.railway.app/api"
    : "http://localhost:5141/api"
);

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// User tracking
export const pingUser          = (deviceId, plan, name, phone = "", passwordHash = "") =>
  req("/users/ping", { method: "POST", body: JSON.stringify({ deviceId, plan, name, phone, passwordHash }) });
export const getUserPlan       = (deviceId)       => req(`/users/${deviceId}/plan`);
export const setUserPlan       = (deviceId, plan) => req(`/users/${deviceId}/plan`, { method: "PUT", body: JSON.stringify({ plan }) });
export const checkPhone        = (phone)          => req("/users/check-phone",    { method: "POST", body: JSON.stringify({ phone }) });
export const loginWithPassword = (phone, passwordHash) =>
  req("/users/login-password", { method: "POST", body: JSON.stringify({ phone, passwordHash }) });

// AI (goes through backend)
export const getAdvice            = (payload) => req("/ai/advice",  { method: "POST", body: JSON.stringify(payload) });
export const sendChat             = (payload) => req("/ai/chat",    { method: "POST", body: JSON.stringify(payload) });
export const getHabitsSuggestions = (payload) => req("/ai/habits",  { method: "POST", body: JSON.stringify(payload) });

// Push notifications
export const checkPushReminders = (payload) => req("/push/check", { method: "POST", body: JSON.stringify(payload) });
