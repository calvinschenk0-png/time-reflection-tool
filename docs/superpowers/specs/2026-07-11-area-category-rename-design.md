# Design: Rename Project/Workstream → Area/Category + default seed data

## Context

The tool was originally scoped work-only ("Personal-life tracking is explicitly deferred," see `work-time-reflection-tool-plan.md` §2). This is now reversed: the tool is pivoting to cover all areas of life reflection, not just work. This is the first of several planned changes toward that pivot.

This spec covers **only** the terminology rename and default category seeding. Other pivot-related changes will be brainstormed and specced separately.

## Goals

1. Rename the noun-axis hierarchy from work-specific terms (Project/Workstream) to life-general terms (Area/Category).
2. Give new (and the current test) accounts a sensible set of default Areas/Categories spanning all areas of life, not just work.
3. Make it unmistakable to users that the defaults are a starting point, not a fixed taxonomy — they're expected to rename, delete, and add their own.

## Non-goals

- No other pivot changes (this is item 1 of several; the rest are separate specs).
- No schema changes beyond the `level` enum rename — table/column names (`hierarchy_nodes`, `parent_id`, etc.) stay as-is; they were already generic.
- No preservation of existing test data — confirmed disposable (see Data handling).

## Terminology

| Old | New |
|---|---|
| Project | Area |
| Workstream | Category |

This is a full rename, not just a UI label swap:
- DB: `hierarchy_nodes.level` enum values `project`/`workstream` → `area`/`category`.
- Code: identifiers, types, and function names that encode the old terms (e.g. `groupByWorkstream`, `groupByProject`, the `'project' | 'workstream'` type unions in `CategoriesTab.tsx`/`CategoryPicker.tsx`) are renamed to match. Exact file list is implementation detail for the plan, not enumerated here.
- UI copy: every visible "Project"/"Workstream" string becomes "Area"/"Category" (Settings tab, Log screen picker, Home/Insights labels, empty states).

## Data handling

Current `hierarchy_nodes`, `time_entries`, and `entry_contacts` rows are test data only (confirmed, no real data to preserve). The migration:
1. Deletes all rows from `entry_contacts`, `time_entries`, `hierarchy_nodes` (in that FK-safe order — `entry_contacts` references `time_entries`, `time_entries` references `hierarchy_nodes`) for the current project.
2. Alters the `hierarchy_nodes.level` enum: rename `project` → `area`, `workstream` → `category`.
3. Seeds the default Areas/Categories (below) for the existing test account via the same seed function used for new signups.

## Default seed data

6 Areas × 3 starter Categories = 24 rows. Colors drawn from the existing 8-value palette already used in `CategoriesTab.tsx`/`CategoryPicker.tsx` (`#2563eb #7c3aed #16a34a #d97706 #dc2626 #0891b2 #be185d #059669`), varied within each Area so no two Categories under the same Area share a color.

| Area | Category | Color |
|---|---|---|
| Work | Meetings | `#2563eb` |
| Work | Deep Work | `#7c3aed` |
| Work | Admin & Email | `#d97706` |
| Health & Fitness | Exercise | `#16a34a` |
| Health & Fitness | Medical | `#dc2626` |
| Health & Fitness | Sleep | `#0891b2` |
| Relationships & Family | Family | `#be185d` |
| Relationships & Family | Friends | `#059669` |
| Relationships & Family | Partner | `#7c3aed` |
| Personal Growth | Learning | `#2563eb` |
| Personal Growth | Reading | `#059669` |
| Personal Growth | Hobbies & Creative | `#be185d` |
| Home & Life Admin | Chores & Errands | `#0891b2` |
| Home & Life Admin | Finances & Bills | `#16a34a` |
| Home & Life Admin | Paperwork & Planning | `#d97706` |
| Rest & Leisure | Downtime & Relaxing | `#7c3aed` |
| Rest & Leisure | Entertainment | `#2563eb` |
| Rest & Leisure | Social Media & Browsing | `#dc2626` |

Deliberately excluded: things like "Faith/Spiritual" or "Volunteering" — not universal enough to presume by default; trivial for a user to add.

## Seeding mechanism

- New helper `seedDefaultCategories(userId)` containing the table above, inserting Areas first then Categories (parented to the just-created Area rows).
- Called from `app/(app)/layout.tsx`, inside the existing `if (!settings)` first-login block (where `user_settings` is auto-created today) — so every new signup is seeded automatically, no separate per-user migration step needed going forward.
- **"Restore defaults"** button added to Settings → Categories. Re-runs `seedDefaultCategories`, but skips inserting any Area or Category whose name already exists for that user (case-insensitive match, checked across both active and archived rows) — so it never creates duplicates. If a whole default Area was deleted, this brings it and its default Categories back. If only one Category under it was renamed, restoring re-adds the original-named Category alongside the renamed one (expected: the user explicitly asked to restore defaults).

## Editability & discoverability

Seeded Areas/Categories are **not** special or protected — same CRUD, same archive/delete rules as anything else the user creates. There is no `is_default` flag or schema marker; "restore defaults" works purely by name-matching against the hardcoded seed list, so once seeded, a default Area/Category is indistinguishable from a user-created one.

To make sure users know they're meant to customize rather than treat the defaults as fixed:
- `CategoriesTab.tsx` currently only shows guidance copy in the empty state (`projects.length === 0`), which will now rarely trigger since every account starts pre-seeded. Replace that pattern with a **persistent intro line above the Areas list**, always visible (not tied to empty state):

  > "These are starting points, not fixed categories. Rename, delete, or add your own to fit how you actually spend your time."

- The "Restore defaults" button sits near this copy, so anyone who deletes something they later want back has an obvious next step.
- Existing empty-state copy (currently work-specific: "A project is the highest level of work...") is retired along with the rest of the work-specific language, since accounts no longer start empty.

## Open questions / risks

None outstanding — all decisions confirmed above. Note for the implementation plan: renaming the `level` enum in Postgres requires `ALTER TYPE ... RENAME VALUE` (or recreate the type, depending on Supabase's Postgres version) — worth confirming which is supported before writing the migration SQL.
