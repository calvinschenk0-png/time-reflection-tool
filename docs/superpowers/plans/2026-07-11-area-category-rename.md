# Area/Category Rename + Default Seed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the noun-axis hierarchy from work-specific terms (Project/Workstream) to life-general terms (Area/Category) throughout the schema and app, and seed every account with 6 default Areas / 18 default Categories spanning all areas of life.

**Architecture:** A DB migration renames the `hierarchy_level` enum and wipes disposable test data. A new `lib/defaultCategories.ts` module holds the canonical seed list and a dedup-safe `seedDefaultCategories()` helper, called both from first-login auto-seeding (`app/(app)/layout.tsx`) and a new "Restore defaults" button in Settings. Every file that encodes the old `'project' | 'workstream'` vocabulary — types, function names, UI copy — is renamed to `'area' | 'category'` to match.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Supabase (`@supabase/ssr`, `@supabase/supabase-js`). No test framework is configured in this project — verification is `npm run build` (TypeScript compile) plus manual smoke-testing against the dev server, matching this repo's existing convention (see `PROGRESS.md` → Conventions).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-area-category-rename-design.md`.
- Terminology: "Project" → **Area**, "Workstream" → **Category**, everywhere (DB enum, types, function names, UI copy).
- No `is_default` schema flag — "Restore defaults" works purely by case-insensitive name matching against the hardcoded seed list, checked across active *and* archived rows.
- Default seed data is exactly the 6 Areas × 3 Categories table in the spec, using colors from the existing `COLORS` palette (`#2563eb #7c3aed #16a34a #d97706 #dc2626 #0891b2 #be185d #059669`).
- Existing `time_entries`, `entry_contacts`, `hierarchy_nodes` rows are test data — confirmed disposable, wiped as part of the migration.
- Build check before every commit: `npm run build` inside `app/`. Only commit if it passes.
- Never commit `.env.local`.

---

### Task 1: Database migration — rename enum, wipe test data

**Files:**
- Create: `supabase/migration_05_area_category_rename.sql`

**Interfaces:**
- Produces: `hierarchy_nodes.level` enum values `area` and `category` (replacing `project`/`workstream`), used by every task below.

- [ ] **Step 1: Write the migration SQL**

```sql
-- =============================================================
-- Migration 05: Rename Project/Workstream to Area/Category
-- Paste into Supabase SQL editor and run.
--
-- What this does:
--   1. Wipes existing time_entries / entry_contacts / hierarchy_nodes
--      (test data only — the app is pivoting from work-only to all
--      areas of life, and the old Project/Workstream data doesn't
--      carry over).
--   2. Renames the hierarchy_level enum values:
--        project    -> area
--        workstream -> category
--      (the 'deliverable' value is left as-is; it's unused, kept for
--      backward compatibility with the enum type.)
-- =============================================================

-- ── 1. Wipe existing test data (FK-safe order) ─────────────────
DELETE FROM entry_contacts;
DELETE FROM time_entries;
DELETE FROM hierarchy_nodes;

-- ── 2. Rename enum values ───────────────────────────────────────
ALTER TYPE hierarchy_level RENAME VALUE 'project' TO 'area';
ALTER TYPE hierarchy_level RENAME VALUE 'workstream' TO 'category';
```

- [ ] **Step 2: Run it in Supabase and verify**

This is a manual step outside the codebase (this project has no Supabase CLI configured — confirmed no `supabase` binary and only an anon key in `.env.local`, so DDL must go through the dashboard, matching how migrations 01–04 were applied per `PROGRESS.md`).

Tell the user to:
1. Open the Supabase SQL editor for this project.
2. Paste the contents of `supabase/migration_05_area_category_rename.sql` and run it.
3. Verify with: `select unnest(enum_range(NULL::hierarchy_level));` — expect `area`, `category`, `deliverable` (no `project`/`workstream`).
4. Verify with: `select count(*) from hierarchy_nodes;` — expect `0`.

Do not proceed to Task 5's runtime testing or Task 12's smoke test until this is confirmed done — the app will error on insert/select against `hierarchy_nodes.level` until the enum is renamed.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration_05_area_category_rename.sql
git commit -m "$(cat <<'EOF'
Add migration: rename Project/Workstream enum to Area/Category

First DB step of the work-only to all-life-areas pivot. Also wipes
existing hierarchy_nodes/time_entries/entry_contacts test data, which
doesn't carry over to the new terminology.
EOF
)"
```

---

### Task 2: Rename the shared `Node` type in the Log module

**Files:**
- Modify: `app/app/(app)/log/types.ts`

**Interfaces:**
- Produces: `Node.level: 'area' | 'category'`, consumed by Tasks 6 and 7 (`CategoryPicker.tsx`, `EntryEditor.tsx`, `WeekCalendar.tsx`, `Timeline.tsx`, `status.ts`, `useLogDay.ts`).

- [ ] **Step 1: Change the level union**

In `app/app/(app)/log/types.ts`, change:

```ts
export type Node = {
  id: string
  name: string
  level: 'project' | 'workstream'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}
```

to:

```ts
export type Node = {
  id: string
  name: string
  level: 'area' | 'category'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}
```

- [ ] **Step 2: Verify the build fails (expected — downstream files still reference old values)**

Run: `npm run build` (from `app/`)
Expected: FAIL — TypeScript errors in `CategoryPicker.tsx` and `settings/CategoriesTab.tsx` about `'project'`/`'workstream'` not being assignable to `'area' | 'category'`. This confirms the type change is wired to its consumers; the errors clear as Tasks 6–8 update those files.

- [ ] **Step 3: Commit**

```bash
git add "app/app/(app)/log/types.ts"
git commit -m "$(cat <<'EOF'
Rename Node.level union to 'area' | 'category'

Foundational type change for the Project/Workstream -> Area/Category
rename; downstream compile errors are expected until the consuming
files are updated in later tasks.
EOF
)"
```

---

### Task 3: Add `disabled` support to `SecondaryButton`

The new "Restore defaults" button (Task 8) needs a disabled state while the restore is in flight, mirroring how `PrimaryButton` already handles `disabled`. `SecondaryButton` doesn't support it yet.

**Files:**
- Modify: `app/components/ui.tsx:57-82`

**Interfaces:**
- Produces: `SecondaryButton` accepts an optional `disabled?: boolean` prop, consumed by Task 8.

- [ ] **Step 1: Add the prop**

Replace:

```tsx
export function SecondaryButton({ children, onClick, type = 'button', style }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: '#fff',
        color: '#111',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
```

with:

```tsx
export function SecondaryButton({ children, onClick, type = 'button', disabled, style }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: '#fff',
        color: '#111',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Run the build**

Run: `npm run build` (from `app/`)
Expected: same pre-existing errors as Task 2 left behind (nothing new introduced by this change — `SecondaryButton`'s existing callers don't pass `disabled` yet, and an optional prop is backward compatible).

- [ ] **Step 3: Commit**

```bash
git add app/components/ui.tsx
git commit -m "Add optional disabled prop to SecondaryButton, matching PrimaryButton"
```

---

### Task 4: Default seed data + seeding helper

**Files:**
- Create: `app/lib/defaultCategories.ts`

**Interfaces:**
- Consumes: a `SupabaseClient` (from `@supabase/supabase-js`) and a `userId: string` — works with both the server client (`lib/supabase/server.ts`) and browser client (`lib/supabase/client.ts`), since both return values structurally compatible with `SupabaseClient`.
- Produces: `DEFAULT_AREAS: DefaultArea[]` (the seed table) and `seedDefaultCategories(supabase, userId): Promise<void>`, consumed by Task 5 (auto-seed on first login) and Task 8 (Restore defaults button).

- [ ] **Step 1: Write the module**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type DefaultCategory = { name: string; color: string }
export type DefaultArea = { name: string; categories: DefaultCategory[] }

export const DEFAULT_AREAS: DefaultArea[] = [
  {
    name: 'Work',
    categories: [
      { name: 'Meetings', color: '#2563eb' },
      { name: 'Deep Work', color: '#7c3aed' },
      { name: 'Admin & Email', color: '#d97706' },
    ],
  },
  {
    name: 'Health & Fitness',
    categories: [
      { name: 'Exercise', color: '#16a34a' },
      { name: 'Medical', color: '#dc2626' },
      { name: 'Sleep', color: '#0891b2' },
    ],
  },
  {
    name: 'Relationships & Family',
    categories: [
      { name: 'Family', color: '#be185d' },
      { name: 'Friends', color: '#059669' },
      { name: 'Partner', color: '#7c3aed' },
    ],
  },
  {
    name: 'Personal Growth',
    categories: [
      { name: 'Learning', color: '#2563eb' },
      { name: 'Reading', color: '#059669' },
      { name: 'Hobbies & Creative', color: '#be185d' },
    ],
  },
  {
    name: 'Home & Life Admin',
    categories: [
      { name: 'Chores & Errands', color: '#0891b2' },
      { name: 'Finances & Bills', color: '#16a34a' },
      { name: 'Paperwork & Planning', color: '#d97706' },
    ],
  },
  {
    name: 'Rest & Leisure',
    categories: [
      { name: 'Downtime & Relaxing', color: '#7c3aed' },
      { name: 'Entertainment', color: '#2563eb' },
      { name: 'Social Media & Browsing', color: '#dc2626' },
    ],
  },
]

type NodeRow = { id: string; name: string; level: 'area' | 'category'; parent_id: string | null }

// Seeds the default Areas/Categories for a user, skipping any Area or Category
// whose name already exists (case-insensitive, active or archived) so it's
// safe to call both on first login and from a "Restore defaults" action.
export async function seedDefaultCategories(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase
    .from('hierarchy_nodes')
    .select('id, name, level, parent_id')
    .eq('user_id', userId)

  const existingNodes: NodeRow[] = data ?? []
  const areaByName = new Map(
    existingNodes.filter(n => n.level === 'area').map(n => [n.name.toLowerCase(), n])
  )

  for (const area of DEFAULT_AREAS) {
    let areaRow = areaByName.get(area.name.toLowerCase())

    if (!areaRow) {
      const { data: created } = await supabase
        .from('hierarchy_nodes')
        .insert({ user_id: userId, name: area.name, level: 'area', parent_id: null })
        .select('id, name, level, parent_id')
        .single()
      if (!created) continue
      areaRow = created
      existingNodes.push(created)
      areaByName.set(area.name.toLowerCase(), created)
    }

    const existingCategoryNames = new Set(
      existingNodes
        .filter(n => n.level === 'category' && n.parent_id === areaRow!.id)
        .map(n => n.name.toLowerCase())
    )

    for (const category of area.categories) {
      if (existingCategoryNames.has(category.name.toLowerCase())) continue
      const { data: created } = await supabase
        .from('hierarchy_nodes')
        .insert({ user_id: userId, name: category.name, level: 'category', parent_id: areaRow.id, color: category.color })
        .select('id, name, level, parent_id')
        .single()
      if (created) existingNodes.push(created)
    }
  }
}
```

- [ ] **Step 2: Run the build**

Run: `npm run build` (from `app/`)
Expected: same pre-existing errors as before (this new file is self-contained and doesn't reference the old vocabulary, so it introduces no new errors).

- [ ] **Step 3: Commit**

```bash
git add app/lib/defaultCategories.ts
git commit -m "$(cat <<'EOF'
Add default Areas/Categories seed data and seeding helper

6 Areas x 3 starter Categories spanning all areas of life (Work,
Health & Fitness, Relationships & Family, Personal Growth, Home &
Life Admin, Rest & Leisure). seedDefaultCategories() is dedup-safe by
name so it can run both on first login and from a "Restore defaults"
action without creating duplicates.
EOF
)"
```

---

### Task 5: Auto-seed defaults on first login

**Files:**
- Modify: `app/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `seedDefaultCategories` from Task 4.

- [ ] **Step 1: Wire the seed call into the first-login block**

Replace the whole file:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { seedDefaultCategories } from '@/lib/defaultCategories'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Auto-create user_settings on first login if it doesn't exist yet
  const { data: settings } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    await supabase.from('user_settings').insert({ user_id: user.id })
    await seedDefaultCategories(supabase, user.id)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar userEmail={user.email ?? ''} />
      <main className="flex-1 flex flex-col" style={{ width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Run the build**

Run: `npm run build` (from `app/`)
Expected: same pre-existing errors as before (unrelated files not yet updated).

- [ ] **Step 3: Commit**

```bash
git add "app/app/(app)/layout.tsx"
git commit -m "Auto-seed default Areas/Categories on first login"
```

---

### Task 6: Rewrite `CategoryPicker.tsx` (Area/Category rename)

**Files:**
- Modify: `app/app/(app)/log/CategoryPicker.tsx`

**Interfaces:**
- Consumes: `Node` from Task 2 (`level: 'area' | 'category'`).
- Produces: `CategoryPicker` prop renamed from `selectedWorkstreamId` to `selectedCategoryId`, consumed by Task 7 (`EntryEditor.tsx`).

- [ ] **Step 1: Replace the whole file**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Node } from './types'
import FieldHeading from './FieldHeading'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoryPicker({ nodes, selectedCategoryId, onPick, onNodesChanged }: {
  nodes: Node[]
  selectedCategoryId: string | null
  onPick: (id: string | null) => void
  onNodesChanged: (nodes: Node[]) => void
}) {
  const supabase = createClient()
  const areas = nodes.filter(n => n.level === 'area' && !n.is_archived)
  const categories = nodes.filter(n => n.level === 'category' && !n.is_archived)
  const selectedCat = nodes.find(n => n.id === selectedCategoryId) ?? null

  const [areaId, setAreaId] = useState<string | null>(selectedCat?.parent_id ?? null)
  const selectedArea = areas.find(a => a.id === areaId) ?? null

  // Area picker UI
  const [aOpen, setAOpen] = useState(false)
  const [aQuery, setAQuery] = useState('')
  const [aCreating, setACreating] = useState(false)
  const [aName, setAName] = useState('')

  // Category picker UI
  const [cOpen, setCOpen] = useState(false)
  const [cQuery, setCQuery] = useState('')
  const [cCreating, setCCreating] = useState(false)
  const [cName, setCName] = useState('')
  const [cColor, setCColor] = useState(COLORS[0])
  const [cDup, setCDup] = useState<string | null>(null)

  async function getUser() { const { data: { user } } = await supabase.auth.getUser(); return user }

  function pickArea(id: string) {
    setAreaId(id)
    if (selectedCat && selectedCat.parent_id !== id) onPick(null)
    setAOpen(false); setAQuery(''); setACreating(false); setAName('')
  }
  async function createArea() {
    const name = aName.trim(); if (!name) return
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'area', parent_id: null }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickArea(data.id) }
  }

  function pickCategory(id: string) {
    onPick(id); setCOpen(false); setCQuery(''); setCCreating(false); setCName(''); setCDup(null)
  }
  async function createCategory() {
    const name = cName.trim(); if (!name || !areaId) return
    const similar = categories.find(c => c.parent_id === areaId && (
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    ))
    if (similar && cDup !== similar.name) { setCDup(similar.name); return }
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'category', parent_id: areaId, color: cColor }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickCategory(data.id) }
  }

  const areaMatches = areas.filter(a => a.name.toLowerCase().includes(aQuery.toLowerCase()))
  const catMatches = categories.filter(c => c.parent_id === areaId && c.name.toLowerCase().includes(cQuery.toLowerCase()))

  return (
    <div>
      {/* AREA */}
      <FieldHeading label="Area" settingsTab="Categories" />
      <div style={{ marginBottom: 14 }}>
        {aCreating ? (
          <div style={createBox}>
            <input autoFocus value={aName} onChange={e => setAName(e.target.value)} placeholder="Area name" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={createArea} disabled={!aName.trim()} style={saveBtn}>Save</button>
              <button onClick={() => { setACreating(false); setAName('') }} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        ) : selectedArea && !aOpen ? (
          <button onClick={() => setAOpen(true)} style={selectedBox}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedArea.name}</span>
            <span style={{ fontSize: 11, color: '#999' }}>change</span>
          </button>
        ) : (
          <div>
            <input autoFocus value={aQuery} onChange={e => { setAQuery(e.target.value); setAOpen(true) }} onFocus={() => setAOpen(true)} placeholder="Type an area…" style={inputStyle} />
            {aOpen && (
              <div style={listBox}>
                {areaMatches.map(a => (
                  <button key={a.id} onClick={() => pickArea(a.id)} style={optionRow}>
                    <span style={{ fontSize: 13, color: '#111' }}>{a.name}</span>
                  </button>
                ))}
                {areaMatches.length === 0 && <div style={emptyRow}>No matches</div>}
                <button onClick={() => { setACreating(true); setAName(aQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                  + New area{aQuery ? ` “${aQuery}”` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CATEGORY */}
      <FieldHeading label="Category" settingsTab="Categories" />
      {!areaId ? (
        <div style={{ fontSize: 12, color: '#999', padding: '9px 12px', border: '1px dashed #e4e4e7', borderRadius: 10 }}>
          Select an area first
        </div>
      ) : cCreating ? (
        <div style={{ ...createBox, background: cColor + '14', border: `1px solid ${cColor}40` }}>
          <input autoFocus value={cName} onChange={e => { setCName(e.target.value); setCDup(null) }} placeholder="Category name" style={inputStyle} />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setCColor(c)} style={{ width: 22, height: 22, borderRadius: 5, background: c, border: 'none', cursor: 'pointer', outline: cColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {cDup && <p style={dupStyle}>You already have “{cDup}”. Click Save again to add anyway.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={createCategory} disabled={!cName.trim()} style={saveBtn}>Save</button>
            <button onClick={() => { setCCreating(false); setCName(''); setCDup(null) }} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      ) : selectedCat && !cOpen ? (
        <button onClick={() => setCOpen(true)} style={{ ...selectedBox, borderColor: selectedCat.color ?? '#e4e4e7' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: selectedCat.color ?? '#999' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedCat.name}</span>
          </span>
          <span style={{ fontSize: 11, color: '#999' }}>change</span>
        </button>
      ) : (
        <div>
          <input autoFocus value={cQuery} onChange={e => { setCQuery(e.target.value); setCOpen(true) }} onFocus={() => setCOpen(true)} placeholder="Type a category…" style={inputStyle} />
          {cOpen && (
            <div style={listBox}>
              {catMatches.map(c => (
                <button key={c.id} onClick={() => pickCategory(c.id)} style={optionRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color ?? '#999' }} />
                    <span style={{ fontSize: 13, color: '#111' }}>{c.name}</span>
                  </span>
                </button>
              ))}
              {catMatches.length === 0 && <div style={emptyRow}>No matches in this area</div>}
              <button onClick={() => { setCCreating(true); setCName(cQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                + New category{cQuery ? ` “${cQuery}”` : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
}
const listBox: React.CSSProperties = { border: '1px solid #e4e4e7', borderRadius: 10, marginTop: 4, overflow: 'hidden' }
const optionRow: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '9px 12px', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
}
const emptyRow: React.CSSProperties = { padding: '10px 12px', fontSize: 12, color: '#999' }
const selectedBox: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px', background: '#fff', cursor: 'pointer',
}
const createBox: React.CSSProperties = { background: '#eef3ff', borderRadius: 10, padding: 12 }
const saveBtn: React.CSSProperties = { background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#666', border: '1px solid #e4e4e7', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }
const dupStyle: React.CSSProperties = { fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginTop: 8 }
```

- [ ] **Step 2: Run the build**

Run: `npm run build` (from `app/`)
Expected: FAIL — `EntryEditor.tsx` still passes the old `selectedWorkstreamId` prop name, and `settings/CategoriesTab.tsx` still uses the old level values. Both clear in Tasks 7 and 8.

- [ ] **Step 3: Commit**

```bash
git add "app/app/(app)/log/CategoryPicker.tsx"
git commit -m "Rename CategoryPicker internals from Project/Workstream to Area/Category"
```

---

### Task 7: Update `EntryEditor.tsx`, `WeekCalendar.tsx`, `Timeline.tsx`

These three files consume `CategoryPicker`'s renamed prop and reference the old level/copy in comments and labels.

**Files:**
- Modify: `app/app/(app)/log/EntryEditor.tsx:45-52`
- Modify: `app/app/(app)/log/WeekCalendar.tsx:147-151,262-271`
- Modify: `app/app/(app)/log/Timeline.tsx:101-105,185-191`

**Interfaces:**
- Consumes: `CategoryPicker`'s `selectedCategoryId` prop from Task 6.

- [ ] **Step 1: Update `EntryEditor.tsx`**

Replace:

```tsx
      {/* Project + Workstream */}
      <div style={{ marginBottom: 16 }}>
        <CategoryPicker
          nodes={nodes}
          selectedWorkstreamId={entry.hierarchy_node_id}
          onPick={(id) => onUpdate(entry.id, { hierarchy_node_id: id })}
          onNodesChanged={onNodesChanged}
        />
      </div>
```

with:

```tsx
      {/* Area + Category */}
      <div style={{ marginBottom: 16 }}>
        <CategoryPicker
          nodes={nodes}
          selectedCategoryId={entry.hierarchy_node_id}
          onPick={(id) => onUpdate(entry.id, { hierarchy_node_id: id })}
          onNodesChanged={onNodesChanged}
        />
      </div>
```

- [ ] **Step 2: Update `WeekCalendar.tsx`**

Replace:

```tsx
  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function projectFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }
```

with:

```tsx
  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function areaFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }
```

Then replace:

```tsx
                  const node = nodeFor(entry.hierarchy_node_id)
                  const project = projectFor(node)
                  const complete = isComplete(entry)
```

with:

```tsx
                  const node = nodeFor(entry.hierarchy_node_id)
                  const area = areaFor(node)
                  const complete = isComplete(entry)
```

Then replace:

```tsx
                      <div onPointerDown={e => beginDrag(e, entry, 'top')} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }} />
                      {/* Workstream */}
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node ? node.name : 'Draft'}
                      </div>
                      {/* Project */}
                      {project && (
                        <div style={{ fontSize: 9, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.name}
                        </div>
                      )}
```

with:

```tsx
                      <div onPointerDown={e => beginDrag(e, entry, 'top')} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize' }} />
                      {/* Category */}
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node ? node.name : 'Draft'}
                      </div>
                      {/* Area */}
                      {area && (
                        <div style={{ fontSize: 9, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {area.name}
                        </div>
                      )}
```

- [ ] **Step 3: Update `Timeline.tsx`**

Replace:

```tsx
  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function projectFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }
```

with:

```tsx
  function nodeFor(id: string | null) { return id ? nodes.find(n => n.id === id) ?? null : null }
  function areaFor(node: Node | null) {
    if (!node) return null
    return node.parent_id ? nodes.find(n => n.id === node.parent_id) ?? null : node
  }
```

Then replace:

```tsx
          const node = nodeFor(entry.hierarchy_node_id)
          const project = projectFor(node)
          const complete = isComplete(entry)
```

with:

```tsx
          const node = nodeFor(entry.hierarchy_node_id)
          const area = areaFor(node)
          const complete = isComplete(entry)
```

Then replace:

```tsx
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node ? node.name : 'Draft — pick a workstream'}
              </div>
              {height > 32 && (
                <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project && complete ? `${project.name} · ` : ''}{formatClock(timeStr(start))}–{formatClock(timeStr(end))}
                </div>
              )}
```

with:

```tsx
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node ? node.name : 'Draft — pick a category'}
              </div>
              {height > 32 && (
                <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {area && complete ? `${area.name} · ` : ''}{formatClock(timeStr(start))}–{formatClock(timeStr(end))}
                </div>
              )}
```

- [ ] **Step 4: Run the build**

Run: `npm run build` (from `app/`)
Expected: FAIL only in `settings/CategoriesTab.tsx` (still pending, Task 8). The log-screen files (`CategoryPicker.tsx`, `EntryEditor.tsx`, `WeekCalendar.tsx`, `Timeline.tsx`, `types.ts`, `status.ts`, `useLogDay.ts`) should now compile clean together.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(app)/log/EntryEditor.tsx" "app/app/(app)/log/WeekCalendar.tsx" "app/app/(app)/log/Timeline.tsx"
git commit -m "Rename Project/Workstream references in Log screen calendar views"
```

---

### Task 8: Rewrite `CategoriesTab.tsx` (Area/Category rename + Restore Defaults + intro copy)

**Files:**
- Modify: `app/app/(app)/settings/CategoriesTab.tsx`

**Interfaces:**
- Consumes: `seedDefaultCategories` from Task 4, `SecondaryButton`'s `disabled` prop from Task 3.

- [ ] **Step 1: Replace the whole file**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, SecondaryButton, DangerButton, Input, ColorDot, Divider } from '@/components/ui'
import { seedDefaultCategories } from '@/lib/defaultCategories'

type Node = {
  id: string
  name: string
  level: 'area' | 'category'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoriesTab({ initialNodes }: { initialNodes: Node[] }) {
  const supabase = createClient()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [adding, setAdding] = useState<null | { level: 'area' | 'category'; parentId: string | null }>(null)
  const [form, setForm] = useState({ name: '', color: COLORS[0] })
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const areas = nodes.filter(n => n.level === 'area' && !n.is_archived)
  const archived = nodes.filter(n => n.is_archived)

  function categoriesFor(areaId: string) {
    return nodes.filter(n => n.level === 'category' && n.parent_id === areaId && !n.is_archived)
  }

  function areaName(id: string | null) {
    return nodes.find(n => n.id === id)?.name ?? 'a deleted area'
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload: any = {
      user_id: user!.id,
      name: form.name.trim(),
      level: adding!.level,
      parent_id: adding!.parentId,
    }
    if (adding!.level === 'category') {
      payload.color = form.color
    }

    const { data } = await supabase.from('hierarchy_nodes').insert(payload).select().single()
    if (data) setNodes(n => [...n, data])
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
    setSaving(false)
  }

  async function archive(id: string) {
    await supabase.from('hierarchy_nodes').update({ is_archived: true }).eq('id', id)
    setNodes(n => n.map(node => node.id === id ? { ...node, is_archived: true } : node))
  }

  async function restore(id: string) {
    await supabase.from('hierarchy_nodes').update({ is_archived: false }).eq('id', id)
    setNodes(n => n.map(node => node.id === id ? { ...node, is_archived: false } : node))
  }

  async function hardDelete(node: Node) {
    const label = node.level === 'area' ? 'area (and any categories inside it)' : 'category'
    if (!confirm(`Permanently delete this ${label}? This cannot be undone.`)) return

    const { error } = await supabase.from('hierarchy_nodes').delete().eq('id', node.id)

    if (error) {
      // The database blocks deletion when logged time still references this node.
      alert("Can't delete — this category has logged time against it. Archive it instead so the history stays intact.")
      return
    }

    // Remove the node (and, for an area, its now-cascade-deleted categories) from the UI
    setNodes(n => n.filter(x => x.id !== node.id && x.parent_id !== node.id))
  }

  async function restoreDefaults() {
    setRestoring(true)
    const { data: { user } } = await supabase.auth.getUser()
    await seedDefaultCategories(supabase, user!.id)
    const { data } = await supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).order('created_at')
    setNodes(data ?? [])
    setRestoring(false)
  }

  function cancel() {
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
  }

  return (
    <div>
      <p style={{ color: '#666', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        These are starting points, not fixed categories. Rename, delete, or add your own to fit how you actually spend your time.
      </p>

      {areas.length === 0 && !adding && (
        <Card>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            No areas yet. An area is the highest level of your life — your broadest, top-level category, like Work, Health, or Family.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={() => setAdding({ level: 'area', parentId: null })}>
              + Add area
            </PrimaryButton>
            <SecondaryButton onClick={restoreDefaults} disabled={restoring}>
              {restoring ? 'Restoring…' : 'Restore defaults'}
            </SecondaryButton>
          </div>
        </Card>
      )}

      {areas.map(area => {
        const addingHere = adding?.level === 'category' && adding.parentId === area.id
        return (
          <Card key={area.id}>
            {/* Area header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>
                {area.name}
              </span>
              <DangerButton onClick={() => archive(area.id)}>Archive</DangerButton>
            </div>

            {/* Categories */}
            <div style={{ paddingLeft: 20 }}>
              {categoriesFor(area.id).map((cat, i, arr) => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <ColorDot color={cat.color ?? '#ccc'} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>{cat.name}</span>
                    <DangerButton onClick={() => archive(cat.id)}>Archive</DangerButton>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}

              {addingHere ? (
                /* Inline category form — nested inside the area card, tinted by selected color */
                <div style={{
                  marginTop: 12,
                  background: form.color + '14',
                  border: `1px solid ${form.color}40`,
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                    New category
                  </p>
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                    Categories are sub-groups within an area. Use them to track how much time you spend on the different parts of a broader area.
                  </p>
                  <Input
                    label="Category name"
                    value={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                    placeholder="e.g. Exercise, Meetings, Family time…"
                  />
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                      Color (shown on the calendar)
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          style={{
                            width: 26, height: 26, borderRadius: 6, background: c,
                            border: 'none', cursor: 'pointer',
                            outline: form.color === c ? `3px solid ${c}` : 'none',
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
                      {saving ? 'Saving…' : 'Save'}
                    </PrimaryButton>
                    <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding({ level: 'category', parentId: area.id })}
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontWeight: 500 }}
                >
                  + Add category
                </button>
              )}
            </div>
          </Card>
        )
      })}

      {/* New area form — its own card */}
      {adding?.level === 'area' && (
        <Card style={{ background: '#eef3ff' }}>
          <SectionHeading>New area</SectionHeading>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            An area is the highest level of your life — your broadest, top-level category. Think Work, Health, Relationships, or Home.
          </p>
          <Input
            label="Area name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Work, Health & Fitness, Relationships…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      {adding?.level !== 'area' && areas.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <PrimaryButton onClick={() => setAdding({ level: 'area', parentId: null })} style={{ flex: 1 }}>
            + Add area
          </PrimaryButton>
          <SecondaryButton onClick={restoreDefaults} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Restore defaults'}
          </SecondaryButton>
        </div>
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowArchived(s => !s)}
            style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 500 }}
          >
            {showArchived ? '▾' : '▸'} Archived ({archived.length})
          </button>

          {showArchived && (
            <Card style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                Archived items are hidden from logging but keep their history. Restore one to use it again.
              </p>
              {archived.map((node, i) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: i < archived.length - 1 ? '1px solid #e4e4e7' : 'none',
                  }}
                >
                  {node.level === 'category' && <ColorDot color={node.color ?? '#ccc'} />}
                  <span style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    {node.name}
                    <span style={{ fontSize: 11, color: '#bbb', marginLeft: 8 }}>
                      {node.level === 'area' ? 'Area' : `Category · ${areaName(node.parent_id)}`}
                    </span>
                  </span>
                  <button
                    onClick={() => restore(node.id)}
                    style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => hardDelete(node)}
                    style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the build**

Run: `npm run build` (from `app/`)
Expected: PASS — this was the last file still referencing the old `'project' | 'workstream'` union in the Log/Settings modules. (`home-calc.ts` and `insights-calc.ts` haven't been touched yet, but they have their own local `NodeRow` union, independent of `log/types.ts` — Tasks 9 and 10 rename those separately and shouldn't currently be causing build errors since their existing values `'project' | 'workstream'` are still internally self-consistent within those two files. If the build still fails, read the error output and confirm it's isolated to `home-calc.ts`/`insights-calc.ts`/their consumers, not a regression in this task's file.)

- [ ] **Step 3: Commit**

```bash
git add "app/app/(app)/settings/CategoriesTab.tsx"
git commit -m "$(cat <<'EOF'
Rewrite Categories settings tab for Area/Category rename

Adds a persistent "these are starting points" intro line above the
Areas list (replacing the old empty-state-only copy, which will now
rarely trigger since accounts start pre-seeded) and a "Restore
defaults" action that re-adds any deleted default without duplicating
what's still present.
EOF
)"
```

---

### Task 9: Rewrite `home-calc.ts` and update its consumers

**Files:**
- Modify: `app/app/(app)/home-calc.ts`
- Modify: `app/app/(app)/page.tsx`
- Modify: `app/app/(app)/HomeDashboard.tsx`

**Interfaces:**
- Produces: `CategoryGroup` (replacing `WorkstreamGroup`), `groupByCategory` (replacing `groupByWorkstream`), consumed by Task 10 (`insights-calc.ts` re-exports these).

- [ ] **Step 1: Replace `home-calc.ts`**

```ts
import { shiftDate, isWeekday } from '@/lib/time'

export type EntryRow = {
  entry_date: string
  duration_minutes: number
  hierarchy_node_id: string | null
}

export type NodeRow = {
  id: string
  name: string
  level: 'area' | 'category'
  parent_id: string | null
  color: string | null
}

export type DayStatus = 'empty' | 'draft' | 'complete'

const DRAFT_COLOR = '#d97706'

function byDate(entries: EntryRow[]): Map<string, EntryRow[]> {
  const map = new Map<string, EntryRow[]>()
  for (const e of entries) {
    if (!map.has(e.entry_date)) map.set(e.entry_date, [])
    map.get(e.entry_date)!.push(e)
  }
  return map
}

// A day is 'complete' once every one of its entries has a category.
// Zero entries is 'empty'; any draft entry (no category yet) makes it 'draft'.
export function dayStatus(entries: EntryRow[]): DayStatus {
  if (entries.length === 0) return 'empty'
  return entries.every(e => e.hierarchy_node_id) ? 'complete' : 'draft'
}

// Oldest-first weekday dates in the trailing `chaseWindowDays` (ending at `today`,
// inclusive) that aren't 'complete'. Weekends are never chased.
export function needsAttentionDates(entries: EntryRow[], chaseWindowDays: number, today: string): string[] {
  const grouped = byDate(entries)
  const dates: string[] = []
  for (let i = chaseWindowDays - 1; i >= 0; i--) {
    const d = shiftDate(today, -i)
    if (!isWeekday(d)) continue
    if (dayStatus(grouped.get(d) ?? []) !== 'complete') dates.push(d)
  }
  return dates
}

// Last 7 calendar days ending at `today` (inclusive), oldest first — for the week-strip pills.
export function weekStripDays(entries: EntryRow[], today: string): { date: string; status: DayStatus; isToday: boolean }[] {
  const grouped = byDate(entries)
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = shiftDate(today, -i)
    days.push({ date: d, status: dayStatus(grouped.get(d) ?? []), isToday: d === today })
  }
  return days
}

export type CategoryGroup = {
  id: string
  name: string
  areaName: string | null
  color: string
  minutes: number
}

// Sums entry minutes by category, resolving each category's parent area name.
// Entries with no category yet (drafts) bucket into a single amber "Unassigned draft" group.
export function groupByCategory(entries: EntryRow[], nodes: NodeRow[]): CategoryGroup[] {
  const nodeById = new Map(nodes.map(n => [n.id, n]))
  const totals = new Map<string, number>()
  for (const e of entries) {
    const key = e.hierarchy_node_id ?? '__draft__'
    totals.set(key, (totals.get(key) ?? 0) + e.duration_minutes)
  }

  const groups: CategoryGroup[] = []
  for (const [key, minutes] of totals) {
    if (key === '__draft__') {
      groups.push({ id: '__draft__', name: 'Unassigned draft', areaName: null, color: DRAFT_COLOR, minutes })
      continue
    }
    const node = nodeById.get(key)
    if (!node) continue
    const area = node.parent_id ? nodeById.get(node.parent_id) ?? null : null
    groups.push({ id: node.id, name: node.name, areaName: area?.name ?? null, color: node.color ?? '#999999', minutes })
  }
  return groups.sort((a, b) => b.minutes - a.minutes)
}

export type WeekBar = { date: string; label: string; minutes: number }

// Mon–Fri totals for the calendar week starting at `weekStart` (a Sunday).
export function weekBars(entries: EntryRow[], weekStart: string): WeekBar[] {
  const totals = new Map<string, number>()
  for (const e of entries) totals.set(e.entry_date, (totals.get(e.entry_date) ?? 0) + e.duration_minutes)
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const bars: WeekBar[] = []
  for (let i = 1; i <= 5; i++) {
    const date = shiftDate(weekStart, i)
    bars.push({ date, label: labels[i], minutes: totals.get(date) ?? 0 })
  }
  return bars
}
```

- [ ] **Step 2: Update `app/(app)/page.tsx`**

Replace:

```tsx
import { createClient } from '@/lib/supabase/server'
import { todayStr, isWeekday, shiftDate, weekStartOf } from '@/lib/time'
import HomeDashboard from './HomeDashboard'
import { needsAttentionDates, weekStripDays, groupByWorkstream, weekBars } from './home-calc'
```

with:

```tsx
import { createClient } from '@/lib/supabase/server'
import { todayStr, isWeekday, shiftDate, weekStartOf } from '@/lib/time'
import HomeDashboard from './HomeDashboard'
import { needsAttentionDates, weekStripDays, groupByCategory, weekBars } from './home-calc'
```

Then replace:

```tsx
      todayBreakdown={groupByWorkstream(todayEntries, nodes ?? [])}
      weekByWorkstream={groupByWorkstream(weekEntries ?? [], nodes ?? [])}
```

with:

```tsx
      todayBreakdown={groupByCategory(todayEntries, nodes ?? [])}
      weekByCategory={groupByCategory(weekEntries ?? [], nodes ?? [])}
```

- [ ] **Step 3: Update `HomeDashboard.tsx`**

Replace the import and prop type block:

```tsx
import Link from 'next/link'
import { Card, SectionHeading, Badge, ColorDot } from '@/components/ui'
import { formatDuration, shortDayLabel, weekRangeLabel } from '@/lib/time'
import { WorkstreamGroup, WeekBar, DayStatus } from './home-calc'
```

with:

```tsx
import Link from 'next/link'
import { Card, SectionHeading, Badge, ColorDot } from '@/components/ui'
import { formatDuration, shortDayLabel, weekRangeLabel } from '@/lib/time'
import { CategoryGroup, WeekBar, DayStatus } from './home-calc'
```

Replace the props destructure and type:

```tsx
export default function HomeDashboard({
  today,
  isWeekendToday,
  hasCategories,
  todayMinutes,
  expectedMinutes,
  attentionCount,
  logDate,
  weekStart,
  stripDays,
  todayBreakdown,
  weekByWorkstream,
  bars,
}: {
  today: string
  isWeekendToday: boolean
  hasCategories: boolean
  todayMinutes: number
  expectedMinutes: number
  attentionCount: number
  logDate: string
  weekStart: string
  stripDays: StripDay[]
  todayBreakdown: WorkstreamGroup[]
  weekByWorkstream: WorkstreamGroup[]
  bars: WeekBar[]
}) {
  const hours = todayMinutes / 60
  const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
  const pct = !isWeekendToday && expectedMinutes > 0 ? Math.min(100, Math.round((todayMinutes / expectedMinutes) * 100)) : 0

  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const todayTotal = todayBreakdown.reduce((s, g) => s + g.minutes, 0)
  const weekTotal = weekByWorkstream.reduce((s, g) => s + g.minutes, 0)
```

with:

```tsx
export default function HomeDashboard({
  today,
  isWeekendToday,
  hasCategories,
  todayMinutes,
  expectedMinutes,
  attentionCount,
  logDate,
  weekStart,
  stripDays,
  todayBreakdown,
  weekByCategory,
  bars,
}: {
  today: string
  isWeekendToday: boolean
  hasCategories: boolean
  todayMinutes: number
  expectedMinutes: number
  attentionCount: number
  logDate: string
  weekStart: string
  stripDays: StripDay[]
  todayBreakdown: CategoryGroup[]
  weekByCategory: CategoryGroup[]
  bars: WeekBar[]
}) {
  const hours = todayMinutes / 60
  const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
  const pct = !isWeekendToday && expectedMinutes > 0 ? Math.min(100, Math.round((todayMinutes / expectedMinutes) * 100)) : 0

  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const todayTotal = todayBreakdown.reduce((s, g) => s + g.minutes, 0)
  const weekTotal = weekByCategory.reduce((s, g) => s + g.minutes, 0)
```

Replace the empty-state copy:

```tsx
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 20 }}>
            Before you log your first day, set up at least one project and workstream — that&rsquo;s what colours your calendar and powers your breakdowns.
          </p>
          <Link
            href="/settings?tab=Categories"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#111',
              color: '#fff',
              borderRadius: 10,
              padding: '11px 18px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'none',
            }}
          >
            Set up your first project
          </Link>
```

with:

```tsx
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 20 }}>
            Before you log your first day, set up at least one area and category — that&rsquo;s what colours your calendar and powers your breakdowns.
          </p>
          <Link
            href="/settings?tab=Categories"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#111',
              color: '#fff',
              borderRadius: 10,
              padding: '11px 18px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: 'none',
            }}
          >
            Set up your first area
          </Link>
```

Replace the "Today by workstream" section:

```tsx
      {/* Today by workstream */}
      <Card>
        <SectionHeading>Today by workstream</SectionHeading>
```

with:

```tsx
      {/* Today by category */}
      <Card>
        <SectionHeading>Today by category</SectionHeading>
```

Replace:

```tsx
                  {g.projectName && <span style={{ fontSize: 12, color: MUTED }}>{g.projectName}</span>}
```

with:

```tsx
                  {g.areaName && <span style={{ fontSize: 12, color: MUTED }}>{g.areaName}</span>}
```

Replace the "This week by workstream" section header and its map:

```tsx
      {/* This week by workstream */}
      <Card>
        <SectionHeading>This week by workstream</SectionHeading>
        {weekByWorkstream.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries logged this week yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weekByWorkstream.map(g => {
```

with:

```tsx
      {/* This week by category */}
      <Card>
        <SectionHeading>This week by category</SectionHeading>
        {weekByCategory.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries logged this week yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weekByCategory.map(g => {
```

- [ ] **Step 4: Run the build**

Run: `npm run build` (from `app/`)
Expected: FAIL — `insights-calc.ts` (Task 10) still imports `WorkstreamGroup`/`groupByWorkstream` from `home-calc.ts`, which no longer export those names.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(app)/home-calc.ts" "app/app/(app)/page.tsx" "app/app/(app)/HomeDashboard.tsx"
git commit -m "Rename Workstream to Category in home-calc and homepage dashboard"
```

---

### Task 10: Rewrite `insights-calc.ts` and update Insights consumers

**Files:**
- Modify: `app/app/(app)/insights/insights-calc.ts`
- Modify: `app/app/(app)/insights/page.tsx`
- Modify: `app/app/(app)/insights/InsightsDashboard.tsx`

**Interfaces:**
- Consumes: `CategoryGroup`, `groupByCategory` from Task 9.

- [ ] **Step 1: Replace `insights-calc.ts`**

```ts
import { isWeekday } from '@/lib/time'
import { EntryRow, NodeRow, CategoryGroup, groupByCategory } from '../home-calc'

export { groupByCategory }
export type { EntryRow, NodeRow, CategoryGroup }

export type AreaGroup = {
  areaName: string
  minutes: number
  categories: CategoryGroup[]
}

// Buckets category groups by their parent area. The synthetic "Unassigned draft"
// group (no area) becomes its own top-level, category-less entry.
export function groupByArea(categoryGroups: CategoryGroup[]): AreaGroup[] {
  const byArea = new Map<string, AreaGroup>()
  for (const g of categoryGroups) {
    const key = g.areaName ?? `__unassigned__${g.id}`
    const label = g.areaName ?? g.name
    if (!byArea.has(key)) byArea.set(key, { areaName: label, minutes: 0, categories: [] })
    const entry = byArea.get(key)!
    entry.minutes += g.minutes
    if (g.areaName) entry.categories.push(g)
  }
  return [...byArea.values()].sort((a, b) => b.minutes - a.minutes)
}

export type EntryWithId = EntryRow & { id: string }

export type ContactGroup = { id: string; name: string; minutes: number }

// Sums entry minutes per contact via the entry_contacts join. An entry with multiple
// contacts counts its full duration toward each contact (this is "time WITH X", not a split).
export function groupByContact(
  entries: EntryWithId[],
  entryContacts: { entry_id: string; contact_id: string }[],
  contacts: { id: string; name: string }[]
): ContactGroup[] {
  const minutesByEntry = new Map(entries.map(e => [e.id, e.duration_minutes]))
  const contactById = new Map(contacts.map(c => [c.id, c]))
  const totals = new Map<string, number>()
  for (const ec of entryContacts) {
    const minutes = minutesByEntry.get(ec.entry_id)
    if (minutes === undefined) continue
    totals.set(ec.contact_id, (totals.get(ec.contact_id) ?? 0) + minutes)
  }
  const groups: ContactGroup[] = []
  for (const [contactId, minutes] of totals) {
    const contact = contactById.get(contactId)
    if (!contact) continue
    groups.push({ id: contact.id, name: contact.name, minutes })
  }
  return groups.sort((a, b) => b.minutes - a.minutes)
}

// Expected minutes for a range: weekdays from rangeStart through min(rangeEnd, today),
// inclusive, times the per-day target. Matches the "to date" convention used elsewhere —
// future days never count toward the expected total.
export function expectedMinutesForRange(rangeStart: string, rangeEnd: string, today: string, perDayMinutes: number): number {
  const cap = rangeEnd < today ? rangeEnd : today
  if (rangeStart > cap) return 0
  let weekdays = 0
  for (let d = new Date(rangeStart + 'T00:00:00'); d <= new Date(cap + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    if (isWeekday(iso)) weekdays++
  }
  return weekdays * perDayMinutes
}

// "Mon 9 – Fri 13" / "Jun 9 – 13" style label for a date range.
export function rangeLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
}
```

- [ ] **Step 2: Update `insights/page.tsx`**

Replace:

```tsx
import { groupByWorkstream, groupByProject, groupByContact, expectedMinutesForRange } from './insights-calc'
```

with:

```tsx
import { groupByCategory, groupByArea, groupByContact, expectedMinutesForRange } from './insights-calc'
```

Replace:

```tsx
  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const totalMinutes = (entries ?? []).reduce((sum, e) => sum + e.duration_minutes, 0)
  const workstreamGroups = groupByWorkstream(entries ?? [], nodes ?? [])

  return (
    <InsightsDashboard
      range={range}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      totalMinutes={totalMinutes}
      expectedMinutes={expectedMinutesForRange(rangeStart, rangeEnd, today, expectedMinutes)}
      projectGroups={groupByProject(workstreamGroups)}
      contactGroups={groupByContact(entries ?? [], entryContacts, contacts ?? [])}
    />
  )
```

with:

```tsx
  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const totalMinutes = (entries ?? []).reduce((sum, e) => sum + e.duration_minutes, 0)
  const categoryGroups = groupByCategory(entries ?? [], nodes ?? [])

  return (
    <InsightsDashboard
      range={range}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      totalMinutes={totalMinutes}
      expectedMinutes={expectedMinutesForRange(rangeStart, rangeEnd, today, expectedMinutes)}
      areaGroups={groupByArea(categoryGroups)}
      contactGroups={groupByContact(entries ?? [], entryContacts, contacts ?? [])}
    />
  )
```

- [ ] **Step 3: Replace `InsightsDashboard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Card, SectionHeading, ColorDot } from '@/components/ui'
import { formatDuration } from '@/lib/time'
import RangeSelector from './RangeSelector'
import { AreaGroup, ContactGroup, rangeLabel } from './insights-calc'

const ACCENT = '#2563eb'
const BORDER = '#e4e4e7'
const MUTED = '#999999'

export default function InsightsDashboard({
  range,
  rangeStart,
  rangeEnd,
  totalMinutes,
  expectedMinutes,
  areaGroups,
  contactGroups,
}: {
  range: 'week' | 'month' | 'custom'
  rangeStart: string
  rangeEnd: string
  totalMinutes: number
  expectedMinutes: number
  areaGroups: AreaGroup[]
  contactGroups: ContactGroup[]
}) {
  const pct = expectedMinutes > 0 ? Math.min(100, Math.round((totalMinutes / expectedMinutes) * 100)) : null

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 20, letterSpacing: '-0.02em' }}>
        Insights
      </h1>

      <RangeSelector range={range} rangeStart={rangeStart} rangeEnd={rangeEnd} />

      {/* Headline */}
      <Card>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{rangeLabel(rangeStart, rangeEnd)}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.03em' }}>
            {formatDuration(totalMinutes)}
          </span>
          <span style={{ fontSize: 13, color: MUTED, paddingBottom: 4 }}>logged</span>
        </div>
        <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: 6, width: `${pct ?? 0}%`, background: ACCENT, borderRadius: 99 }} />
        </div>
        <p style={{ fontSize: 12, color: MUTED }}>
          {expectedMinutes > 0 ? `${pct}% of ${formatDuration(expectedMinutes)} expected to date` : 'No workdays in range yet'}
        </p>
      </Card>

      {/* Area -> Category */}
      <Card>
        <SectionHeading>Time by area</SectionHeading>
        {areaGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries logged in this range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {areaGroups.map(a => (
              <AreaRow key={a.areaName} area={a} />
            ))}
          </div>
        )}
      </Card>

      {/* Time with contacts */}
      <Card>
        <SectionHeading>Time with contacts</SectionHeading>
        {contactGroups.length === 0 ? (
          <p style={{ fontSize: 13, color: MUTED }}>No entries with contacts logged in this range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contactGroups.map(c => {
              const top = contactGroups[0].minutes
              const pct = top > 0 ? Math.round((c.minutes / top) * 100) : 0
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#111', flex: 1, fontWeight: 500 }}>{c.name}</span>
                  <div style={{ width: 100, height: 6, background: BORDER, borderRadius: 99 }}>
                    <div style={{ height: 6, width: `${pct}%`, background: ACCENT, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: MUTED, minWidth: 48, textAlign: 'right' }}>{formatDuration(c.minutes)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function AreaRow({ area }: { area: AreaGroup }) {
  const [open, setOpen] = useState(true)
  const hasCategories = area.categories.length > 0

  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8, marginTop: 4 }}>
      <button
        type="button"
        onClick={() => hasCategories && setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: hasCategories ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        {hasCategories && (
          <span style={{ color: MUTED, fontSize: 10, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s', width: 10 }}>
            ▶
          </span>
        )}
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>{area.areaName}</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#111' }}>{formatDuration(area.minutes)}</span>
      </button>

      {open && hasCategories && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0 8px 18px' }}>
          {area.categories.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ColorDot color={c.color} />
              <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{formatDuration(c.minutes)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the build**

Run: `npm run build` (from `app/`)
Expected: PASS — this closes out the last file referencing the old `Project`/`Workstream` vocabulary in the app source (excluding standalone copy in `login/page.tsx`, `DESIGN.md`, `PROGRESS.md`, handled in Task 11).

- [ ] **Step 5: Commit**

```bash
git add "app/app/(app)/insights/insights-calc.ts" "app/app/(app)/insights/page.tsx" "app/app/(app)/insights/InsightsDashboard.tsx"
git commit -m "Rename Project to Area throughout Insights screen"
```

---

### Task 11: Copy cleanup — login blurb, DESIGN.md, PROGRESS.md

**Files:**
- Modify: `app/app/login/page.tsx:52-58`
- Modify: `DESIGN.md:41`
- Modify: `PROGRESS.md`

**Interfaces:** None — copy-only changes, no code interfaces affected.

- [ ] **Step 1: Update the login page blurb**

Replace:

```tsx
          <p style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            A private log of where your workday actually goes — by project, workstream, and who you spent it with.
          </p>
```

with:

```tsx
          <p style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            A private log of where your time actually goes — by area, category, and who you spent it with.
          </p>
```

This also drops the "workday" framing from the one piece of pre-signup marketing copy in the app, consistent with the pivot away from work-only.

- [ ] **Step 2: Fix the stale "Engagement" label in `DESIGN.md`**

In `DESIGN.md`, replace:

```
- **Engagement colours:** user-chosen per engagement, consistent across all charts
```

with:

```
- **Category colours:** user-chosen per category, consistent across all charts
```

(This line predates even the Project/Workstream terminology — a leftover from the original Engagement/Workstream/Deliverable naming that was never cleaned up. Since we're already touching every other terminology reference, fix it here too.)

- [ ] **Step 3: Add a PROGRESS.md entry**

Add a new section after the "### Phase 7 — Polish ✓" section and before "### Signed-in smoke test ✓" (or at the end of the file if that section has since moved — search for the phase structure and place it as the most recent dated entry), following the existing terse style of other entries:

```markdown
### Post-launch pivot — Area/Category rename + default seed data ✓
The tool pivoted from work-only to covering all areas of life. `hierarchy_nodes.level` enum renamed `project`/`workstream` → `area`/`category` (migration `supabase/migration_05_area_category_rename.sql`); all app code, types, and UI copy renamed to match. New accounts are auto-seeded with 6 default Areas × 3 Categories spanning Work, Health & Fitness, Relationships & Family, Personal Growth, Home & Life Admin, and Rest & Leisure (`lib/defaultCategories.ts`). Settings → Categories now carries a persistent "these are starting points" line and a "Restore defaults" action (re-adds any deleted default by name, without duplicating what's still present — no `is_default` schema flag). Existing test data in `hierarchy_nodes`/`time_entries`/`entry_contacts` was wiped as part of the migration (confirmed disposable, no real data existed).
```

- [ ] **Step 4: Run the build**

Run: `npm run build` (from `app/`)
Expected: PASS (Markdown edits don't affect compilation; this confirms the login page edit didn't introduce a syntax error).

- [ ] **Step 5: Commit**

```bash
git add "app/app/login/page.tsx" DESIGN.md PROGRESS.md
git commit -m "$(cat <<'EOF'
Copy cleanup: login blurb, DESIGN.md, PROGRESS.md for Area/Category pivot

Drops work-only framing from the login page's pre-signup blurb, fixes
a stale "Engagement colours" label left over from before the
Project/Workstream naming, and documents the pivot in PROGRESS.md.
EOF
)"
```

---

### Task 12: Final build check + manual smoke test

**Files:** None (verification only).

**Interfaces:** None.

- [ ] **Step 1: Confirm Task 1's migration has actually been run**

Before testing anything live, confirm with the user that `supabase/migration_05_area_category_rename.sql` has been run against the real Supabase project (Task 1, Step 2). If not, stop here and get that done first — every step below will fail against the old enum.

- [ ] **Step 2: Full build**

Run: `npm run build` (from `app/`)
Expected: PASS with no TypeScript or lint errors.

- [ ] **Step 3: Manual smoke test against the dev server**

Run: `npm run dev` (from `app/`), then in a browser (or via the `claude-in-chrome` skill if available):

1. Sign up a fresh test account (or log in fresh if `hierarchy_nodes` was wiped for the existing account in Task 1).
2. **Settings → Categories:** confirm the 6 default Areas (Work, Health & Fitness, Relationships & Family, Personal Growth, Home & Life Admin, Rest & Leisure) appear, each with its 3 starter Categories and assigned colors. Confirm the "These are starting points…" intro line is visible. Delete one Category, then click "Restore defaults" and confirm it reappears without duplicating anything else. Archive an Area and confirm it moves to the Archived section labeled "Area"; a Category should be labeled "Category · <parent area name>".
3. **Log screen:** open the day editor, confirm the picker fields are labeled "Area" and "Category" (not "Project"/"Workstream"), Area-first selection filters the Category list correctly, and creating a new Area/Category works with the duplicate-guard warning still functioning on Category names.
4. **Home:** confirm "Today by category" and "This week by category" section headings, and that colors/names render correctly for logged entries.
5. **Insights:** confirm "Time by area" section heading, expand an area row to see its categories, and confirm "Time with contacts" still works unchanged.
6. Delete any test entries created during the walkthrough so no residual data is left, consistent with the existing smoke-test convention noted in `PROGRESS.md`.

- [ ] **Step 4: Report results**

Summarize what was tested and any issues found. If everything passes, this plan is complete — no commit needed for this task (verification only, nothing to stage).

---

## Summary of terminology renames (reference table for reviewers)

| Old | New |
|---|---|
| `hierarchy_nodes.level` enum `'project'` | `'area'` |
| `hierarchy_nodes.level` enum `'workstream'` | `'category'` |
| `WorkstreamGroup` (type, `home-calc.ts`) | `CategoryGroup` |
| `groupByWorkstream` (`home-calc.ts`) | `groupByCategory` |
| `ProjectGroup` (type, `insights-calc.ts`) | `AreaGroup` |
| `groupByProject` (`insights-calc.ts`) | `groupByArea` |
| `CategoryPicker` prop `selectedWorkstreamId` | `selectedCategoryId` |
| `HomeDashboard` prop `weekByWorkstream` | `weekByCategory` |
| `InsightsDashboard` prop `projectGroups` | `areaGroups` |
| `projectFor()` (`WeekCalendar.tsx`, `Timeline.tsx`) | `areaFor()` |
| UI copy "Project" / "Workstream" | "Area" / "Category" |
