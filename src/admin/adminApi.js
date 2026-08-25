const API = import.meta.env.VITE_API_URL ?? (
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://moneyka-api-production.up.railway.app/api"
    : "http://localhost:5141/api"
);
const BASE = API + "/admin";

async function req(path, options = {}) {
  const key = localStorage.getItem("mk_admin_key") || "";
  const res = await fetch(`${BASE}${path}`, {
    // credentials:"include" sends the httpOnly admin_token cookie from an SSO login;
    // the X-Admin-Key header still authorises the manual-key path.
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Admin-Key": key },
    ...options,
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok)            throw new Error(`${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// SSO hydration: when the operator arrives via the hub tile, the backend sets an
// httpOnly admin_token cookie (no localStorage key). Probe a protected endpoint with
// credentials so the cookie is sent; 200 means the cookie session is valid.
export async function checkSession() {
  try {
    const res = await fetch(`${BASE}/stats`, { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

export const adminLogin  = (key)       => fetch(`${BASE}/login`, {
  method: "POST", body: "{}",
  credentials: "include",
  headers: { "Content-Type": "application/json", "X-Admin-Key": key },
}).then(r => { if (!r.ok) throw new Error("unauthorized"); return r.json(); });

export const getStats    = ()          => req("/stats");
export const getUsers    = ()          => req("/users");
export const setUserPlan = (id, plan)  => req(`/users/${id}/plan`, { method: "PUT",    body: JSON.stringify({ plan }) });
export const deleteUser  = (id)        => req(`/users/${id}`,      { method: "DELETE" });
