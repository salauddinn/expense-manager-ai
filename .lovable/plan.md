

## Minimal & Clean Redesign

Current state: generic card-heavy layout, bold blue primary, heavy borders, gradient on net worth card, cramped spacing.

### Design Direction
Notion/Stripe inspired -- generous whitespace, whisper-thin borders, restrained color, elegant typography.

### Changes by Area

**1. Colors & Theme (index.css)**
- Background: warmer near-white (`210 20% 99%`), cards pure white
- Borders: lighter (`220 14% 92%`)
- Primary: softer blue-indigo (`224 55% 52%`)
- Dark mode: deeper, less contrast between card and background
- Increase `--radius` to `0.875rem`

**2. Header (AppLayout)**
- Remove border-b and backdrop blur
- Clean white bar with just a thin `shadow-sm` separator
- Wider max-width (`max-w-2xl`)
- App name: remove emoji, use clean text wordmark

**3. Bottom Nav**
- Replace hard border-t with subtle `shadow-[0_-1px_3px_rgba(0,0,0,0.05)]`
- More padding, slightly smaller icons (h-4 w-4)
- Active state: filled dot indicator under icon instead of color change

**4. Dashboard**
- Greeting line: "Good morning" + today's date instead of "Dashboard"
- Net Worth: flat white card, no gradient, large number with subtle label above
- Stat cards: 2x2 grid with more internal padding, numbers larger, labels smaller and lighter
- Chart: remove grid lines, softer rounded bars, minimal axis styling
- Recent transactions: simple list rows with thin dividers, no individual cards

**5. Transactions**
- Filter: pill-style segmented control (All / Income / Expense) replacing Select dropdown
- Rows: flat list with `divide-y` instead of individual cards
- Delete button: ghost, visible on hover only (opacity-0 group-hover:opacity-100)

**6. Chat**
- Bubbles: larger border-radius (rounded-2xl), user messages in soft primary/5 tint
- Input: rounded-full with more horizontal padding
- Suggestion chips: pill-style, subtle border, hover lift

**7. Accounts**
- Section headers: small uppercase tracking-wide text instead of bold + icon
- Items: flat rows with dividers, not cards
- Cleaner empty states

**8. Budget**
- Progress bars: thinner (h-1.5), softer rounded ends
- Category labels as subtle pills
- More vertical spacing between items

### Files Modified
- `src/index.css` -- theme variables
- `src/components/layout/AppLayout.tsx` -- header, max-width
- `src/components/layout/BottomNav.tsx` -- nav styling
- `src/pages/Dashboard.tsx` -- full layout refresh
- `src/pages/Transactions.tsx` -- list style, filter pills
- `src/pages/Chat.tsx` -- bubble and input styling
- `src/pages/Accounts.tsx` -- flat list sections
- `src/pages/Budget.tsx` -- progress bar refinements

