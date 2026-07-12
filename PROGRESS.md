# Time Reflection Tool — Progress

## Current status: Phases 0–7 complete (rough build done). Every screen built and polished with empty/loading/error states. Next up: refine + debug pass (see "What's next").

Live app: https://time-reflection-tool.vercel.app
GitHub: https://github.com/calvinschenk0-png/time-reflection-tool
Local app folder: `C:\Users\calvi\Desktop\time_refelction_tool\app\`

---

## ⚠️ Database migrations — run these in the Supabase SQL editor if not already done
Order matters. Files live in `supabase/`:
1. `migration_01_schema.sql` — all tables
2. `migration_02_rls.sql` — row-level security policies
3. `migration_03_simplify.sql` — rename enum `engagement`→`project`; drop `activities`, `activity_id`, workday hour columns, `engagement_type`/`charge_code`
4. `migration_04_draft_entries.sql` — makes `time_entries.hierarchy_node_id` nullable (so draft/amber blocks can save)

All four have already been run in the current Supabase project. Listed here so a fresh DB can be rebuilt.

---

## Key product decisions (locked)
- **Terminology:** Project (primary) → Workstream (secondary). Two levels only, one self-referencing `hierarchy_nodes` table (`level`, `parent_id`). NO deliverable level.
- **Color lives on the workstream** (not the project) — it colors calendar blocks/charts.
- **Activities removed** from v1 entirely (no table, no field).
- **Design direction:** Option C2 "Bold Signal / Grey Cards". Tokens in `app/globals.css` + `components/ui.tsx`, documented in `DESIGN.md`.
- **Completion rule** (`app/(app)/log/status.ts` → `isComplete`): a block is confirmed (shows workstream color) once it has a **workstream**. Contacts + note are optional. No workstream = yellow draft.
- **"Finish logging day" was removed.** Completion is per-block now. `logged_days` table still exists but is unused → Phase 5 "needs attention" must be redefined (days within chase window that have draft blocks or no entries).

---

## What's done

### Phase 0 — Scaffold ✓
Next.js (App Router) + Tailwind v4 + Supabase packages. Deployed on Vercel, auto-deploys from GitHub `main`. `.env.local` holds Supabase URL + publishable key (gitignored). Supabase env vars also set in Vercel.

### Phase 1 — Schema + RLS ✓
Tables: `hierarchy_nodes`, `contacts`, `time_entries`, `entry_contacts`, `logged_days`, `user_settings`. RLS on every table scoped to `auth.uid() = user_id` (entry_contacts scoped via parent entry).

### Phase 2 — Auth + shell ✓
Email/password auth, middleware-protected routes, NavBar (Home/Log/Insights/Settings + sign out), auto-create `user_settings` on first login. Files: `middleware.ts`, `app/login/`, `app/auth/callback/`, `app/(app)/layout.tsx`, `components/NavBar.tsx`.

### Phase 2.5 — Design system ✓
`DESIGN.md` + `components/ui.tsx` (Card, PrimaryButton, Input, etc.). Fonts: Space Grotesk (display) + Inter (body). Prototypes still live at `/design/option-a…c2`, `/design/incomplete`, `/design/coverage` (safe to delete later).

### Phase 3 — Settings ✓
`app/(app)/settings/`: tabbed shell (`SettingsShell.tsx`) — deep-linkable via `?tab=Categories|Contacts`.
- `CategoriesTab.tsx` — Projects + Workstreams CRUD, workstream color, nested add form, archive + "Show archived" with restore/hard-delete (DB blocks delete if entries reference it).
- `ContactsTab.tsx` — contacts CRUD with fuzzy duplicate guard.
- `GeneralTab.tsx` — chase window only.

### Phase 4 — Log screen ✓ (then heavily extended)
Folder `app/(app)/log/`. Architecture: **one logic hook `useLogDay.ts` ("the brain"); separate desktop/mobile layouts** that both consume it; thin switcher `LogDay.tsx` using `ResponsiveView`.

Files:
- `page.tsx` — server component. Reads `?date=YYYY-MM-DD&view=week|month`. Fetches the visible range (week or whole month) of entries + contacts + nodes + settings, computes month-to-date coverage. **Passes `key={date-view}` to LogDay so it remounts on navigation** (fixes stale-state bug).
- `useLogDay.ts` — all state + actions (add/create/update/drag/delete/contacts, week+month nav, view toggle).
- `LogDayDesktop.tsx` — Week/Month toggle (top-left), period nav (center), Today (right); coverage stat; 80/20 grid (calendar + attribute panel); "+ Add entry" pinned at bottom of panel.
- `LogDayMobile.tsx` — single-day view + slide-up editor sheet.
- `WeekCalendar.tsx` — 7-day grid. Drag blocks between days + up/down for time; resize edges (15-min snap); **drag on empty space to create**; right-click a block → Delete menu; per-day coverage meters in headers; blocks show workstream + project + time + people. No overlaps (`overlap.ts`).
- `MonthCalendar.tsx` — month grid, entries per cell (click to select), "+N more".
- `Timeline.tsx` — mobile single-day timeline (drag/resize, gap bands).
- `EntryEditor.tsx` — attribute panel. Notion-style single-box `TimeBox` (15-min list), bigger field headings with gear links to Settings, note, delete.
- `CategoryPicker.tsx` — Project-first typeahead → filtered Workstream, both with create + duplicate guard.
- `ContactPicker.tsx` — multi-select contact typeahead with create.
- `FieldHeading.tsx` — heading + gear → `/settings?tab=…`.
- `status.ts` (isComplete), `overlap.ts` (collision rules), `types.ts`.
- Helpers in `lib/time.ts` (week/month math), `lib/useViewport.ts`.

Coverage features: day-header meters (week view); week-to-date % (week view) and month-to-date % (month view). "To date" = weekdays up to today only; weekends excluded from the 8h/day target.

### Phase 5 — Homepage dashboard ✓
Files, all in `app/(app)/`:
- `home-calc.ts` — pure helpers: `dayStatus` (empty/draft/complete — draft = has entries but at least one lacks a workstream), `needsAttentionDates` (oldest-first, weekday-only, over `chase_window_days`), `weekStripDays` (fixed last-7-calendar-days for the pill strip, independent of the configurable chase window), `groupByWorkstream` (sums minutes by workstream, resolves project name via `parent_id`, buckets draft entries into an amber "Unassigned draft" group), `weekBars` (Mon–Fri totals for the current calendar week).
- `page.tsx` — server component; fetches settings/nodes/entries, composes props, no client state needed (no interactivity beyond `Link` navigation).
- `HomeDashboard.tsx` — presentational: hero (hours + ring + "Log your time" button, badged with the needs-attention count, routes to the oldest incomplete day), week strip (7 tappable day pills), today-by-workstream (stacked bar + list), this-week bar chart (links to Log week view), this-week-by-workstream (bar list).

Notable decisions: weekends are excluded from "needs attention" entirely (nobody expects weekend logging); on a weekend `today`, the ring/percentage framing is suppressed and replaced with "No workday expected today"; the week-strip's visible 7 pills are independent of a user-configured `chase_window_days` ≠ 7 — the "Log your time" button and its badge count still use the true full window, just not all reflected as pills.

### Phase 6 — Insights ✓
Files in `app/(app)/insights/`:
- `insights-calc.ts` — pure helpers: `groupByProject` (buckets `home-calc.ts`'s `groupByWorkstream` output by parent project; the "Unassigned draft" bucket becomes its own project-less row), `groupByContact` (sums entry minutes per contact via the `entry_contacts` join — an entry with N contacts counts its full duration toward each, since this is "time WITH X" not a split), `expectedMinutesForRange`, `rangeLabel`.
- `page.tsx` — server component; reads `?range=week|month|custom&start&end`, fetches nodes/contacts/entries+entry_contacts for the resolved range.
- `RangeSelector.tsx` — client; This week / This month tabs are plain links, Custom reveals two date inputs + Apply (pushes `?range=custom&start&end`).
- `InsightsDashboard.tsx` — client (needs the accordion's expand/collapse state): headline (total logged + thin progress bar vs. expected-to-date), "Time by project" (project rows, click to expand into their workstreams, colored by workstream), "Time with contacts" (bar list, uniform accent color — contacts have no color of their own).

**Redefined scope vs. the original plan:** activities were removed in the v1 pivot, so the plan's "time by Activity" chart and activity-based cross-tab no longer apply — there's only one noun axis (Project→Workstream) left. Chart 2 was replaced with "time with contacts" (reusing `entry_contacts`); no cross-tab was built (with one real axis, it didn't add enough to justify the UI). Recharts (named in the original plan) was **not** adopted — every chart across the app so far is hand-rolled inline-SVG/div to match the custom "Bold Signal" design system exactly, so Insights kept that pattern rather than introducing a themed dependency.

---

### Phase 7 — Polish ✓
- **Homepage empty state:** a brand-new user with zero `hierarchy_nodes` sees a "Welcome" card prompting them to set up their first project (`/settings?tab=Categories`) instead of the normal dashboard. Log/Insights already degraded gracefully to per-section "no entries" text, so no changes needed there.
- **Loading state:** one shared `app/(app)/loading.tsx` skeleton (grey card placeholders) — because it sits next to `layout.tsx`, it covers Home/Log/Insights/Settings navigations via the same Suspense boundary, no per-route file needed.
- **Error boundary:** one shared `app/(app)/error.tsx` — note this Next.js version (16.2.9) renamed the error-boundary reset callback from `reset` to `unstable_retry`; matched that signature.
- **Landing/login page** (`app/login/page.tsx`) restyled in the Bold Signal design system (Card/Input/PrimaryButton from `components/ui.tsx`) with a one-line product blurb, so a shared link makes sense to a newcomer before they even sign up.
- **Cleanup:** deleted the `/design/*` prototype routes and the dead unused `EngagementsTab.tsx` (pre-pivot leftover, not imported anywhere).
- **Framework deprecation:** this Next.js version deprecated the `middleware.ts` convention in favor of `proxy.ts` (same behavior, renamed file + function). Migrated via `git mv` + rename; also dropped the now-gone `/design/` allowance from the public-path check.
- Fixed a CSS build warning: the Google Fonts `@import` in `globals.css` must precede `@import "tailwindcss"`.

### Post-launch pivot — Area/Category rename + default seed data ✓
The tool pivoted from work-only to covering all areas of life. `hierarchy_nodes.level` enum renamed `project`/`workstream` → `area`/`category` (migration `supabase/migration_05_area_category_rename.sql`); all app code, types, and UI copy renamed to match. New accounts are auto-seeded with 6 default Areas × 3 Categories spanning Work, Health & Fitness, Relationships & Family, Personal Growth, Home & Life Admin, and Rest & Leisure (`lib/defaultCategories.ts`). Settings → Categories now carries a persistent "these are starting points" line and a "Restore defaults" action (re-adds any deleted default by name, without duplicating what's still present — no `is_default` schema flag). Existing test data in `hierarchy_nodes`/`time_entries`/`entry_contacts` was wiped as part of the migration (confirmed disposable, no real data existed).

### Signed-in smoke test ✓ (done against local dev server, real account)
Walked Home → Log (drag-create, resize, drag-between-days, right-click delete, Week/Month toggle, month cell click-to-edit) → Insights (week/month/custom range) → Settings (Categories/Contacts/General) — all worked as expected. Test entry created during the pass was deleted afterward; no residual data.

**Bug found and fixed:** an invalid `?date=` (e.g. a hand-edited or stale bookmarked URL) crashed the Log page server-side (`RangeError: Invalid time value` in `weekStartOf`), showing the new error boundary instead of the page — the boundary worked, but the crash itself was avoidable. Added `isValidDateStr()` in `lib/time.ts` and used it to validate `date` in `log/page.tsx` and `start`/`end` in `insights/page.tsx`, falling back to today/this-week on anything malformed instead of throwing.

**Not tested:** mobile viewport widths — the browser automation tool's `resize_window` didn't take effect in this environment (screenshots stayed desktop-width regardless), so the mobile Log/Home layouts were only verified by reading `lib/useViewport.ts` (a standard `matchMedia('(max-width: 767px)')` hook), not visually. Worth a manual check on an actual phone or real browser resize.

### What's next
- Manual mobile-width check (see above).
- `logged_days` table unused — decide whether to repurpose or drop.
- Month view is click-to-select only (no drag) — by design.

---

## Conventions / how to work with this repo
- Build check before every commit: `npm run build` inside `app/`. Only commit if it passes (a broken build won't deploy but wastes a cycle).
- Deploy = push to `main`; Vercel auto-builds.
- Never commit `.env.local` (already gitignored).
- New screens follow the responsive pattern: one logic hook + `LogDay{Desktop,Mobile}`-style views + `ResponsiveView`.
- User is non-technical — explain concepts plainly; confirm before large changes.
