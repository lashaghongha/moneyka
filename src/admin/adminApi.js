const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5141/api") + "/admin";

async function req(path, options = {}) {
  const key = localStorage.getItem("mk_admin_key") || "";
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", "X-Admin-Key": key },
    ...options,
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok)            throw new Error(`${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export const adminLogin  = (key)       => fetch(`${BASE}/login`, {
  method: "POST", body: "{}",
  headers: { "Content-Type": "application/json", "X-Admin-Key": key },
}).then(r => { if (!r.ok) throw new Error("unauthorized"); return r.json(); });

export const getStats    = ()          => req("/stats");
export const getUsers    = ()          => req("/users");
export const setUserPlan = (id, plan)  => req(`/users/${id}/plan`, { method: "PUT",    body: JSON.stringify({ plan }) });
export const deleteUser  = (id)        => req(`/users/${id}`,      { method: "DELETE" });
