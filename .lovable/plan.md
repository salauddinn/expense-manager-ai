

## Fix 10 Bugs and Issues

### 1. queryEngine.ts hardcodes 'INR' currency
**File:** `src/lib/queryEngine.ts`
- Add a `currency` field to `FinancialData` interface (default `'INR'`)
- Derive currency from accounts data (first account's currency or DEFAULT_CURRENCY)
- Replace all `formatCurrency(x, 'INR')` with `formatCurrency(x, currency)`

### 2. clearMessages deletes ALL users' chat messages
**File:** `src/hooks/useChatActions.ts` ~line 374
- Get current user session, add `.eq('user_id', session.user.id)` filter to the delete query

### 3. supabase.ts throws at module load
**File:** `src/lib/supabase.ts`
- Replace `throw new Error(...)` with a console warning and export a nullable/dummy client, or use empty string fallbacks so the app doesn't crash on public pages

### 4. useSupabaseCrud has no user_id filter on reads
**File:** `src/hooks/useSupabaseCrud.ts`
- Get session inside queryFn, add `.eq('user_id', session.user.id)` to the select query as a defense-in-depth measure alongside RLS

### 5. Backup import restores to localStorage only
**File:** `src/lib/backup.ts`
- Rewrite `importBackup()` to upsert data directly into Supabase tables instead of writing to localStorage
- Keep localStorage fallback only if Supabase is unavailable

### 6. Landing page copy contradicts auth requirement
**File:** `src/pages/Landing.tsx`
- Change "No signup required" → "Free to get started" 
- Change "No signup. No credit card." → "Free forever. No credit card needed."
- Update CTA links from `/dashboard` to `/signup` so users hit the proper auth flow

### 7. Gemini API key exposed in URL
**File:** `src/lib/llmService.ts`
- Move API key from URL query param to `x-goog-api-key` header (Gemini supports this)

### 8. No loading states on Dashboard
**File:** `src/pages/Dashboard.tsx`
- Check `isLoading` from all 5 hooks, show a spinner/skeleton while any are loading

### 9. Image upload stores base64 in Supabase
**File:** `src/hooks/useChatActions.ts`
- Upload image to Supabase Storage bucket, store the public URL in `image_url` instead of the base64 data URL

### 10. package.json name
**File:** `package.json`
- Change `"name": "vite_react_shadcn_ts"` → `"name": "fintrack"`

