# MoneyKa — Georgian Personal Finance App

> A smart, Georgian-language personal finance PWA that helps you track income and expenses, plan budgets, set savings goals, and get AI-powered financial advice.

**Live app:** https://moneyka.vercel.app

---

## Features

- **Dashboard** — real-time income/expense overview with monthly labels
- **Transactions** — add, filter, and categorize income & expenses (Georgian categories)
- **Recurring Transactions** — auto-repeating salary, subscriptions, and bills
- **Subscription Tracker** — next charge dates, monthly cost summary
- **Budget Planner** — weekly / bi-weekly / monthly budget with proportional scaling
- **Savings Goals** — track progress toward financial goals
- **AI Financial Advisor** — personalized advice powered by Groq (LLaMA 3.3 70B)
- **Analytics** — spending breakdown by category and time period
- **Export** — download transaction history
- **Habit Tracker** — financial habit suggestions from AI
- **Premium Tiers** — Free / Pro / Elite plans

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **PWA (Vite PWA Plugin)** | Installable on mobile & desktop |
| **CSS-in-JS (inline styles)** | Component styling |
| **localStorage** | Client-side data persistence |
| **Vercel** | Hosting & deployment |

### Backend
| Technology | Purpose |
|---|---|
| **.NET 9 (ASP.NET Core)** | REST API |
| **PostgreSQL** | User data, plans, OTP |
| **Entity Framework Core** | ORM & migrations |
| **Groq API (LLaMA 3.3 70B)** | AI financial advice |
| **Railway** | Hosting & deployment |

### Integrations
| Service | Purpose |
|---|---|
| **Groq (free tier)** | AI advisor — fast LLaMA 3.3 inference |
| **Web Push API** | Budget & payment reminders |

---

## Architecture

```
moneyka.vercel.app  (React PWA)
        │
        │  REST API
        ▼
moneyka-api.railway.app  (.NET 9)
        │
        ├── PostgreSQL  (users, plans, OTP)
        └── Groq API    (AI advice)
```

All personal financial data (transactions, budgets, goals) is stored locally on the user's device via `localStorage` — no financial data is sent to the server.

---

## Development

```bash
# Frontend
cd georgian-expense-tracker
npm install
npm run dev          # http://localhost:5173

# Backend
cd moneyka-api
dotnet run           # http://localhost:5141
```

**Required env vars (Railway):**
```
ConnectionStrings__DefaultConnection=...
Groq__ApiKey=...
Admin__Key=...
```

**Required env vars (Vercel):**
```
VITE_API_URL=https://moneyka-api-production.up.railway.app/api
```
