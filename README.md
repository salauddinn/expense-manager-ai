# FinTrack — Personal Finance Tracker

A mobile-first personal finance tracker with a smart chat interface for managing income, expenses, bank accounts, credit cards, loans, assets, and budgets via natural language.

## Features

- 💬 **Chat to Track** — Type "spent ₹500 on groceries" and it's saved
- 🤖 **AI-Powered** — Bring your own OpenAI or Gemini API key for natural language understanding
- 📊 **Dashboard** — Net worth, income vs expenses chart, recent transactions
- 🎯 **Budget Goals** — Set spending limits per category with progress tracking
- 🏦 **Accounts** — Manage bank accounts, credit cards, and assets
- 💰 **Loan Calculator** — EMI calculator with amortization table
- 📱 **PWA** — Installable, works offline, mobile-first design
- 🔒 **Private** — API keys stored locally, data in your Supabase instance

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **UI**: shadcn/ui (Radix primitives)
- **Charts**: Recharts
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI / Google Gemini via tool/function calling

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests |
| `bun run lint` | Lint with ESLint |

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
