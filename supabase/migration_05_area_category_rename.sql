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
