# TenPhel — Project Progress

**Last Updated:** May 19, 2026 | **Status:** 🟢 MVP Complete & Deployed
**Repo:** `Norbu-d/DSO101_final_project` (main branch) | **Location:** `d:\tenphel\tenphel`

---

## 1. Project Overview

**TenPhel** is a student-focused money tracking app for Bhutanese students to manage spending in Ngultrum (Nu.). Features: user auth, real-time balance, expense/income logging, spending analytics, and transaction history — all in a mobile-first dark UI.

---

## 2. Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16.2.4, React 19, TypeScript, Tailwind CSS 4 |
| Charts | Recharts 3.8.1 |
| Icons | Lucide React |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Vercel (frontend) + Docker Hub (image registry) |
| Package Mgr | npm |

---

## 3. Folder Structure

```
tenphel/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + AuthProvider
│   │   ├── page.tsx                # Redirects auth → dashboard
│   │   ├── globals.css             # Dark theme, CSS variables
│   │   ├── auth/page.tsx           # Login / signup / balance setup
│   │   └── dashboard/
│   │       ├── page.tsx            # Main dashboard
│   │       └── history/page.tsx    # Full transaction history
│   ├── components/
│   │   ├── LogExpenseModal.tsx     # Expense form modal
│   │   ├── ReceivedMoneyModal.tsx  # Income form modal
│   │   └── TransactionRow.tsx      # Reusable transaction item
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state + useAuth() hook
│   └── lib/
│       ├── db.ts                   # 15+ database functions
│       ├── supabase.ts             # Supabase client + TS types
│       └── constants.ts            # Categories, formatting utils
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD pipeline
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Local Docker dev setup
├── .dockerignore                   # Docker build exclusions
├── next.config.ts                  # Next.js config (standalone output)
├── supabase-schema.sql             # DB schema + RLS policies
└── package.json
```

---

## 4. Completed Work

### Auth (`src/context/AuthContext.tsx`, `src/app/auth/page.tsx`)
- `useAuth()` hook exposes `{ user, profile, loading, signOut, refreshProfile }`
- Multi-step UI: login → register → set initial balance
- Auto-redirects on session state change

### Dashboard (`src/app/dashboard/page.tsx`)
- Balance card, monthly received/spent stats
- Spending insights: daily average, top 3 categories with progress bars
- Recent 10 transactions with delete
- Buttons to open expense/income modals

### History (`src/app/dashboard/history/page.tsx`)
- All transactions, grouped by date
- Filter: All / Expenses / Income

### Modals
- **LogExpenseModal** — amount, quick buttons (50–2000 Nu.), 10 categories, date, note, live balance preview
- **ReceivedMoneyModal** — amount, quick buttons (500–5000 Nu.), 6 income sources, date, note

### Database (`src/lib/db.ts`) — Key Functions

```typescript
// Auth
signUp(email, password, name, initialBalance)   // creates user + profile + default categories
signIn(email, password)

// Expenses
logExpense(userId, amount, categoryId, note, date, currentBalance)
getExpenses(userId)
getMonthlyExpenses(userId)
deleteExpense(expenseId, userId, amount, currentBalance)  // refunds balance

// Income
logIncome(userId, amount, source, note, date, currentBalance)
getIncomeEntries(userId)

// Analytics
getRecentTransactions(userId)   // merged + sorted expenses & income
getCategoryTotals(expenses)
getMonthlyTotal(expenses)
getDailyAverage(expenses)
```

### Database Schema (`supabase-schema.sql`)

```sql
-- 6 tables: users, categories, expenses, income_entries, budgets, alerts
CREATE TABLE public.users (
  id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, current_balance DECIMAL DEFAULT 0
);
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), amount DECIMAL NOT NULL,
  category_id TEXT REFERENCES categories(id), note TEXT, date DATE NOT NULL
);
-- RLS: users read/update own rows; expenses/income full CRUD on own rows
```

### Constants (`src/lib/constants.ts`)

```typescript
EXPENSE_CATEGORIES  // 10: Food, Transport, Entertainment, Education, Utilities,
                    //     Clothing, Healthcare, Gifts, Subscriptions, Other
INCOME_SOURCES      // 6: Parents, Stipend, Part-time, Scholarship, Gift, Other
QUICK_AMOUNTS       // [50, 100, 200, 500, 1000, 2000]
formatNu(amount)    // → "Nu. 1,000.00"
formatDate(str)     // → "Today" / "Yesterday" / "May 4"
today()             // → "2026-05-19"
```

### Docker (`Dockerfile`, `docker-compose.yml`)
- Multi-stage Dockerfile: deps → builder → runner (node:20-alpine)
- `output: "standalone"` enabled in `next.config.ts` for lean production image
- Supabase env vars injected as build args at image build time
- Non-root user (`nextjs`) for container security
- `docker compose up --build` tested and verified locally ✅
- Image runs at `http://localhost:3000`

### CI/CD Pipeline (`.github/workflows/deploy.yml`)
- **Job 1 — Lint:** runs `next lint` on every push and PR
- **Job 2 — Docker:** builds image and pushes to Docker Hub (`username/tenphel:latest` + `username/tenphel:<sha>`) on push to main
- **Job 3 — Deploy Production:** deploys to Vercel automatically on push to main
- **Job 4 — Preview Deploy:** deploys preview URL on every PR and posts it as a comment
- Vercel project linked: `norbu-ds-projects/tenphel`
- All 7 GitHub secrets configured ✅

---

## 5. Issues Fixed

| Problem | Fix |
|---------|-----|
| 401 on signup | Fixed RLS INSERT policy (`WITH CHECK (true)`) |
| Blank dashboard after login | Fixed RLS SELECT policy on users table |
| Email confirmation blocking auth | Disabled in Supabase dashboard |
| React hydration errors | Added `suppressHydrationWarning` to inputs |
| ESLint inline style warnings | Disabled rule in `eslint.config.mjs` |
| Docker standalone build | Added `output: "standalone"` to `next.config.ts` |
| Lint script broken | Changed `"lint": "eslint"` → `"lint": "next lint"` in `package.json` |

---

## 6. What's Next

**High Priority**
- [ ] User settings (edit name, password, balance)
- [ ] Budget system (per-category limits + alerts UI)
- [ ] Advanced charts (monthly trends, category pie chart)

**Medium Priority**
- [ ] Search transactions by note
- [ ] Date range filtering
- [ ] CSV / PDF export

**Lower Priority**
- [ ] PWA / offline support
- [ ] Recurring transactions
- [ ] AI spending insights

---

## 7. How to Continue in a New Chat

### Paste this context block:
```
PROJECT: TenPhel — Bhutanese student money tracker
TECH: Next.js 16 + TypeScript + Supabase + Tailwind CSS + React 19
STATUS: MVP complete — auth, expenses, income, analytics, Docker + CI/CD all working
LOCATION: d:\tenphel\tenphel
REPO: Norbu-d/DSO101_final_project (main branch)

KEY FILES:
- src/lib/db.ts                    → all DB functions
- src/context/AuthContext.tsx      → auth state + useAuth()
- src/app/dashboard/page.tsx       → main UI
- supabase-schema.sql              → DB schema + RLS
- Dockerfile                       → multi-stage Docker build
- .github/workflows/deploy.yml     → GitHub Actions CI/CD pipeline

DEPLOYMENT:
- Vercel project: norbu-ds-projects/tenphel
- Docker Hub: username/tenphel
- CI/CD: push to main → lint → Docker build → Vercel deploy (fully automated)

NEXT WORK: user settings, budgets, analytics charts
```

### Setup Checklist
```bash
npm install
# Create .env:
# NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
npm run dev          # → http://localhost:3000 (local dev)
docker compose up --build  # → http://localhost:3000 (Docker)
```

### GitHub Secrets Required
| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel deployment auth |
| `VERCEL_ORG_ID` | `team_KRwfjVI3B10md7KZmg448CyD` |
| `VERCEL_PROJECT_ID` | `prj_rDNHtuJSSvOuxILpLwZJPa4s0yD6` |
| `DOCKERHUB_USERNAME` | Docker Hub image push |
| `DOCKERHUB_TOKEN` | Docker Hub auth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

- [ ] Supabase: email confirmation **OFF**, schema applied, RLS enabled
- [ ] Verify 6 tables exist: `users, categories, expenses, income_entries, budgets, alerts`