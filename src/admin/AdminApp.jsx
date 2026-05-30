import { useState, useEffect } from "react";
import * as adminApi from "./adminApi";
import AdminLogin    from "./AdminLogin";
import StatsRow      from "./StatsRow";
import PlanBreakdown from "./PlanBreakdown";
import UsersTable    from "./UsersTable";

export default function AdminApp() {
  const [authed,  setAuthed]  = useState(() => !!localStorage.getItem("mk_admin_key"));
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [s, u] = await Promise.all([adminApi.getStats(), adminApi.getUsers()]);
      setStats(s); setUsers(u);
    } catch (e) {
      if (e.message === "unauthorized") {
        localStorage.removeItem("mk_admin_key"); setAuthed(false);
      } else {
        setError("Backend კავშირი ვერ მოხდა. API გაშვებულია?");
      }
    }
    setLoading(false);
  }

  useEffect(() => { if (authed) loadData(); }, [authed]);

  async function handleChangePlan(id, plan) {
    try { await adminApi.setUserPlan(id, plan); loadData(); }
    catch (e) { alert("შეცდომა: " + e.message); }
  }

  async function handleDelete(id) {
    if (!confirm("მომხმარებლის წაშლა?")) return;
    try { await adminApi.deleteUser(id); loadData(); }
    catch (e) { alert("შეცდომა: " + e.message); }
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1a11",
      fontFamily: "'BPG Nino Mkhedruli','Sylfaen',Georgia,serif", color: "#fff"
    }}>
      {/* Header */}
      <div style={{
        background: "#0a1a0e", borderBottom: "1px solid rgba(76,175,82,0.2)",
        padding: "14px 28px", display: "flex", justifyContent: "space-between",
        alignItems: "center", position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span style={{ fontWeight: 800, fontSize: 18 }}>MoneyKa</span>
          <span style={{
            background: "rgba(76,175,82,0.15)", color: "#4CAF82",
            borderRadius: 8, padding: "2px 10px", fontSize: 12, fontWeight: 700
          }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadData} disabled={loading} style={{
            background: "rgba(76,175,82,0.12)", border: "1px solid rgba(76,175,82,0.25)",
            borderRadius: 10, padding: "7px 16px", color: "#4CAF82",
            fontWeight: 600, fontSize: 13, cursor: "pointer"
          }}>
            {loading ? "⏳" : "↺ განახლება"}
          </button>
          <button onClick={() => { localStorage.removeItem("mk_admin_key"); setAuthed(false); }} style={{
            background: "rgba(224,84,112,0.1)", border: "1px solid rgba(224,84,112,0.2)",
            borderRadius: 10, padding: "7px 16px", color: "#E05470",
            fontWeight: 600, fontSize: 13, cursor: "pointer"
          }}>
            გამოსვლა
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "28px", maxWidth: 1200, margin: "0 auto" }}>
        {error && (
          <div style={{
            background: "rgba(224,84,112,0.1)", border: "1px solid rgba(224,84,112,0.3)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#E05470", fontSize: 14
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading && !stats ? (
          <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,0.25)", fontSize: 16 }}>
            ⏳ იტვირთება...
          </div>
        ) : stats ? (
          <>
            <StatsRow stats={stats} />
            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
              <PlanBreakdown planCounts={stats.planCounts} total={stats.totalUsers} />
              <UsersTable users={users} onChangePlan={handleChangePlan} onDelete={handleDelete} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
