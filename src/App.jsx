import { useState, useEffect } from "react";
import * as api from "./api";
import { storage, getDeviceId, auth } from "./storage";
import { checkBudgetWarning, checkSubscriptionReminders } from "./notifications";

// Components
import BottomNav        from "./components/BottomNav";
import PremiumNav       from "./components/PremiumNav";
import PWAInstallBanner from "./components/PWAInstallBanner";

// Pages
import AuthPage          from "./pages/AuthPage";
import HomePage          from "./pages/HomePage";
import AnalyticsPage     from "./pages/AnalyticsPage";
import TransactionsPage  from "./pages/TransactionsPage";
import GoalsPage         from "./pages/GoalsPage";
import ProfilePage       from "./pages/ProfilePage";
import AddPage           from "./pages/AddPage";
import PremiumPage       from "./pages/PremiumPage";
import AIAdvisorPage     from "./pages/AIAdvisorPage";
import RecurringPage     from "./pages/RecurringPage";
import ExportPage        from "./pages/ExportPage";
import HabitsPage        from "./pages/HabitsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BudgetPage        from "./pages/BudgetPage";

const PAGE_TITLES = {
  home:          "მთავარი",
  analytics:     "ანალიტიკა",
  transactions:  "ტრანზაქციები",
  goals:         "მიზნები",
  profile:       "პროფილი",
  add:           "დამატება",
  premium:       "Premium",
  ai:            "AI მრჩეველი",
  recurring:     "განმეორებადი",
  export:        "ექსპორტი",
  habits:        "ჩვევების ანალიზი",
  subscriptions: "💳 გამოწერები",
  budget:        "📊 ბიუჯეტი",
};

export default function App() {
  // ძველი localStorage session გასუფთავება (migration)
  localStorage.removeItem("moneyka_session");

  // v1.0 data reset — test მონაცემების გასუფთავება
  if (!localStorage.getItem("mk_data_v1")) {
    localStorage.removeItem("moneyka_transactions");
    localStorage.removeItem("moneyka_goals");
    localStorage.removeItem("moneyka_subs");
    localStorage.removeItem("moneyka_budgets");
    localStorage.setItem("mk_data_v1", "done");
  }

  const [loggedIn, setLoggedIn]           = useState(() => auth.isLoggedIn());
  const [page, setPage]                   = useState("home");
  const [transactions, setTransactions]   = useState(() => storage.getTransactions());
  const [goals, setGoals]                 = useState(() => storage.getGoals());
  const [subs, setSubs]                   = useState(() => storage.getSubs());
  const [showAdd, setShowAdd]             = useState(false);
  const [addCat, setAddCat]               = useState("food");
  const [plan, setPlan]                   = useState(() => storage.getPlan());
  const [currency, setCurrency]           = useState(() => localStorage.getItem("mk_currency") || "GEL");
  const [darkMode, setDarkMode]           = useState(() => localStorage.getItem("mk_theme") !== "light");

  const CUR_SYM = { GEL: "₾", USD: "$", EUR: "€", GBP: "£" };
  const cur = CUR_SYM[currency] || "₾";

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function handleThemeChange(dark) {
    setDarkMode(dark);
    localStorage.setItem("mk_theme", dark ? "dark" : "light");
  }

  // ერთჯერადი cleanup — duplicate სუბსკრიფცია ტრანზაქციების წაშლა
  useEffect(() => {
    if (!loggedIn) return;
    setTransactions(prev => {
      // sub_ prefix-იანი ID-ები ან ძველი გენერირებულები დუბლიკატის პრევენციისთვის
      const seen = new Set();
      return prev.filter(t => {
        if (!t.recurring || t.amount >= 0) return true;
        const key = `${t.desc}__${t.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }, [loggedIn]);

  // გამოწერების ავტო-ჩარიცხვა — nextDate <= დღეს → ONE ტრანზაქცია + nextDate +1 period
  useEffect(() => {
    if (!loggedIn) return;
    const today = new Date().toISOString().split("T")[0];

    setSubs(prevSubs => {
      const newTxs = [];
      const updatedSubs = prevSubs.map(s => {
        if (!s.active || !s.nextDate || s.nextDate > today) return s;

        // დეტერმინისტული ID — ერთი და იგივე sub+date ვერასდროს დუბლირდება
        const txId = `sub_${s.id}_${s.nextDate}`;
        newTxs.push({
          id:        txId,
          category:  "utilities",
          desc:      s.name,
          amount:    -Math.round(s.price * 100) / 100,
          date:      s.nextDate,
          time:      "09:00",
          type:      "expense",
          recurring: true,
          recFreq:   s.billing === "monthly" ? "monthly" : "yearly",
        });

        // nextDate +1 period
        const next = new Date(s.nextDate);
        if (s.billing === "yearly") next.setFullYear(next.getFullYear() + 1);
        else next.setMonth(next.getMonth() + 1);
        return { ...s, nextDate: next.toISOString().split("T")[0] };
      });

      if (newTxs.length > 0) {
        setTransactions(prev => {
          const existingIds = new Set(prev.map(t => String(t.id)));
          const fresh = newTxs.filter(t => !existingIds.has(t.id));
          if (fresh.length === 0) return prev;
          return [...fresh, ...prev];
        });
      }
      return updatedSubs;
    });
  }, [loggedIn]);

  // Notification checks on login
  useEffect(() => {
    if (!loggedIn) return;
    const t = setTimeout(() => {
      // Local (app open) notifications
      checkBudgetWarning(transactions, cur);
      checkSubscriptionReminders(subs, cur);
      // Background push (app closed) — sub reminders via backend
      if (localStorage.getItem("mk_notif_sub") !== "0") {
        api.checkPushReminders({
          deviceId: getDeviceId(),
          subs: subs.map(s => ({ id: s.id, name: s.name, price: s.price, nextDate: s.nextDate, active: s.active }))
        }).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [loggedIn]);

  // Ping + plan sync on startup
  useEffect(() => {
    if (!loggedIn) return;
    const deviceId = getDeviceId();
    // Ping-ი backend-ის plan-ს აბრუნებს (admin-მა შეიძლება შეცვალა)
    api.pingUser(deviceId, storage.getPlan(), auth.getName(), localStorage.getItem("moneyka_user_phone") || "")
      .then(({ plan }) => {
        if (plan && plan !== storage.getPlan()) {
          storage.savePlan(plan);
          setPlan(plan);
        }
      })
      .catch(() => {});
  }, [loggedIn]);

  // Persist to localStorage
  useEffect(() => { storage.saveTransactions(transactions); }, [transactions]);
  useEffect(() => { storage.saveGoals(goals);               }, [goals]);
  useEffect(() => { storage.saveSubs(subs);                 }, [subs]);
  useEffect(() => {
    storage.savePlan(plan);
    if (loggedIn) api.setUserPlan(getDeviceId(), plan).catch(() => {});
  }, [plan]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!loggedIn) {
    return <AuthPage onAuth={() => setLoggedIn(true)} />;
  }

  const isPremium  = plan !== "free";
  const isElite    = plan === "elite";
  const planColor  = plan === "elite" ? "#F59E0B" : plan === "pro" ? "#A78BFA" : "#4CAF82";
  const currentPage = showAdd ? "add" : page;

  function handleAddTx(cat = "food") { setAddCat(cat); setShowAdd(true); }
  function handleTxAdded(tx)         { setTransactions(t => [{ ...tx, id: Date.now() }, ...t]); }
  function handleSelectPlan(p)       { setPlan(p); setPage("home"); }
  function handleLogout()            { auth.logout(); setLoggedIn(false); setPage("home"); }

  return (
    <div className="mk-app" style={{
      fontFamily: "'BPG Nino Mkhedruli', 'Sylfaen', Georgia, serif",
      background: "#0a160f", minHeight: "100vh",
      maxWidth: 390, margin: "0 auto",
      position: "relative", overflowX: "hidden", color: "#fff"
    }}>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      {/* Plan color accent bar */}
      <div style={{
        background: isPremium
          ? (plan === "elite" ? "linear-gradient(135deg,#2a1a00,#1a1000)" : "linear-gradient(135deg,#1a0d3a,#0d0d2e)")
          : "linear-gradient(135deg,#1a3a2a,#0d2419)",
        height: 4,
        borderBottom: `1px solid ${planColor}33`
      }} />

      {/* Premium sub-nav */}
      {!showAdd && (
        <PremiumNav page={page} setPage={setPage} plan={plan} onUpgrade={() => setPage("premium")} />
      )}

      {/* Page Content */}
      <div style={{ overflowY: "auto", height: "calc(100vh - 100px)" }}>
        {showAdd ? (
          <AddPage onAdd={handleTxAdded} defaultCat={addCat} onClose={() => setShowAdd(false)} plan={plan} cur={cur} />
        ) : page === "home" ? (
          <HomePage transactions={transactions} goals={goals} onAddTx={handleAddTx} plan={plan} onUpgrade={() => setPage("premium")} onNavigate={setPage} cur={cur} />
        ) : page === "analytics" ? (
          <AnalyticsPage transactions={transactions} plan={plan} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "transactions" ? (
          <TransactionsPage transactions={transactions} setTransactions={setTransactions} cur={cur} />
        ) : page === "goals" ? (
          <GoalsPage goals={goals} setGoals={setGoals} plan={plan} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "profile" ? (
          <ProfilePage plan={plan} setPlan={setPlan} setPage={setPage} onLogout={handleLogout}
            currency={currency} onCurrencyChange={v => { setCurrency(v); localStorage.setItem("mk_currency", v); }}
            darkMode={darkMode} onThemeChange={handleThemeChange} cur={cur} />
        ) : page === "premium" ? (
          <PremiumPage currentPlan={plan} onSelectPlan={handleSelectPlan} onClose={() => setPage("home")} />
        ) : page === "ai" ? (
          <AIAdvisorPage transactions={transactions} isPremium={isPremium} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "recurring" ? (
          <RecurringPage transactions={transactions} isPremium={isPremium} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "export" ? (
          <ExportPage transactions={transactions} isPremium={isPremium} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "habits" ? (
          <HabitsPage transactions={transactions} isPremium={isPremium} isElite={isElite} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : page === "subscriptions" ? (
          <SubscriptionsPage isPremium={isPremium} onUpgrade={() => setPage("premium")} subs={subs} setSubs={setSubs} cur={cur} />
        ) : page === "budget" ? (
          <BudgetPage transactions={transactions} goals={goals} isPremium={isPremium} onUpgrade={() => setPage("premium")} cur={cur} />
        ) : null}
      </div>

      <BottomNav
        page={page}
        setPage={p => { setShowAdd(false); setPage(p); }}
        onAdd={() => handleAddTx()}
        plan={plan}
      />

      <PWAInstallBanner />
    </div>
  );
}
