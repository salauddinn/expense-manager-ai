

## Goal Detail Page + Compact Card History

### What changes
1. **Goal cards** — show only the **last 3 contributions** inline, with a "View all →" link
2. **New `/goals/:id` detail page** — full goal info with complete contribution history, all linked transactions, creation date, deadline, progress, and actions (contribute, link, delete)

### Technical plan

**`src/pages/GoalDetail.tsx`** (new)
- Route param `:id`, lookup goal from `useFinancialGoals`
- Full header: icon, name, category, created date, deadline
- Large progress bar with milestone dots
- Complete contribution history list (all entries, newest first) with date, amount, source icon, and label
- Actions: add contribution, link transaction, delete goal
- Back link to `/goals`

**`src/App.tsx`**
- Add route: `/goals/:id` → `GoalDetail`

**`src/pages/Goals.tsx`**
- Trim history section to `.slice(-3)` with a `<Link to={/goals/${goal.id}}>View all →</Link>` button
- Make goal card name/icon clickable → navigates to detail page

