# FinTrack — Personal Finance Tracker

## Overview
A mobile-first personal finance tracker with a smart chat interface for managing income, expenses, bank accounts, credit cards, loans, assets, and budgets via natural language.

## Architecture

### Frontend
- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS
- **UI Library**: shadcn/ui (Radix primitives + Tailwind)
- **Charts**: Recharts
- **Routing**: React Router v6
- **State**: Custom hooks + localStorage (migration-ready for cloud backend)

### Data Layer
- All data hooks (`useTransactions`, `useBankAccounts`, `useCreditCards`, `useAssets`, `useLoans`, `useBudgetGoals`) abstract storage behind a common `useLocalStorage` hook.
- This pattern ensures a clean migration path to Supabase/Lovable Cloud — swap `useLocalStorage` internals without touching components.

### Chat Parser (`src/lib/chatParser.ts`)
- Rule-based NLP parser supporting 7 intents: transaction, bank_account, credit_card, asset, loan, budget, query.
- Supports Indian number shorthands (lakh, crore), currency symbols (₹, $, €, £, ¥), and relative dates.
- Intent detection uses keyword matching with priority ordering (query > bank > card > asset > loan > budget > transaction).

## Mobile Migration Plan

### Strategy: Progressive Web App (PWA) → Optional Capacitor Native

**Phase 1 — PWA (Recommended First Step)**
- Install `vite-plugin-pwa` and configure manifest
- Add mobile-optimized meta tags (viewport, theme-color, apple-touch-icon)
- Configure service worker for offline support
- Add `/install` page with install prompt
- Already mobile-first responsive design (max-w-lg, bottom nav, touch-friendly)

**Phase 2 — Capacitor Native (Optional)**
- If native device features needed (camera for receipt OCR, push notifications, biometrics)
- Capacitor config:
  - `appId`: `app.lovable.5862c2af62174a33b6ea515cdc751575`
  - `appName`: `FinTrack`
  - Server URL for dev: `https://5862c2af-6217-4a33-b6ea-515cdc751575.lovableproject.com?forceHideBadge=true`
- Native platforms: iOS (Xcode required), Android (Android Studio required)
- Sync command after changes: `npx cap sync`

### Mobile-Readiness Checklist
- [x] Mobile-first responsive layout (max-w-lg container)
- [x] Bottom navigation bar (thumb-friendly)
- [x] Touch-optimized button sizes (min 44px tap targets)
- [x] Fixed input bar at bottom of chat
- [x] Camera/photo upload support for receipts
- [x] Dark mode support
- [x] Semantic design tokens (HSL-based theming)
- [ ] PWA manifest + service worker
- [ ] Offline data access
- [ ] App icons (192x192, 512x512)
- [ ] Splash screens
- [ ] Capacitor native wrapper (if needed)

## Pages & Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Net worth, stats, chart, recent transactions |
| `/chat` | Chat | Smart NLP chat for all entity management |
| `/transactions` | Transactions | Filterable list with CSV export |
| `/budget` | Budget | Monthly budget goals with progress bars |
| `/accounts` | Accounts | Bank accounts, credit cards, assets management |
| `/loan-calculator` | Loan Calculator | EMI calculator with amortization table |

## Key Files
- `src/lib/chatParser.ts` — NLP intent parser (7 intents, extensible keyword maps)
- `src/lib/currencies.ts` — Currency formatting + symbols
- `src/lib/categories.ts` — Expense/income category definitions
- `src/lib/exportData.ts` — CSV export utility
- `src/lib/loanCalculator.ts` — EMI + amortization logic
- `src/hooks/useLocalStorage.ts` — Generic localStorage hook (swap target for migration)
- `src/types/finance.ts` — All domain type definitions
- `src/components/layout/AppLayout.tsx` — Shared layout with header + bottom nav
- `src/components/ThemeToggle.tsx` — Dark/light mode toggle

## Design System
- HSL-based color tokens in `src/index.css` (light + dark modes)
- Semantic tokens: `--primary`, `--destructive`, `--success`, `--warning`, `--muted`
- Font: Inter (sans-serif)
- Border radius: 0.75rem
- All colors via Tailwind semantic classes — no hardcoded hex/rgb in components

## Future Enhancements
- [ ] Lovable Cloud backend (auth + persistent DB)
- [ ] Receipt OCR via AI
- [ ] Recurring transactions
- [ ] Multi-currency portfolio view
- [ ] Monthly email/notification reports
- [ ] Data import (bank CSV/PDF statements)
