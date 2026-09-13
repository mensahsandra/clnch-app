/*
# Add detail columns to opportunities table

1. Purpose
   The frontend (src/types/index.ts, src/context/OpportunitiesContext.tsx) already
   expects opportunities to carry title, description, location, award_value,
   urgency, and monitoring fields. The original table (migration 001) only had
   link, organization, category, requirements, deadline, status. This migration
   adds the missing columns so the app can store and display the full extraction
   result returned by the `extract` edge function.

2. New Columns on `opportunities`
   - `title` (text) — short human-readable title of the opportunity
   - `description` (text) — 2-3 sentence summary from AI extraction
   - `location` (text) — physical location, "Remote", or "Global"
   - `award_value` (text) — funding amount / stipend / benefit value
   - `eligibility_regions` (text[]) — countries or regions eligible to apply
   - `application_url` (text) — direct URL to application form if different from `link`
   - `urgency` (text) — "High" | "Medium" | "Low", derived client-side but persisted for sorting
   - `monitor_status` (text) — "idle" | "watching" | "changed"
   - `monitor_goal` (text) — what the user wants to watch for on the page
   - `monitor_id` (text) — external monitor job identifier
   - `last_checked_at` (timestamptz) — last time the monitor checked the page
   - `change_summary` (text) — summary of changes detected by the monitor

   All new columns are nullable and have no NOT NULL constraint so existing rows
   remain valid. `title` defaults to NULL; the frontend already falls back to
   `organization` when title is missing.

3. Updated `status` check constraint
   The frontend's OpportunityStatus type includes: saved, pending, in_progress,
   applied, shortlisted, rejected, awarded, filed, archived. The original CHECK
   only allowed pending, filed, archived. We replace it to match the full set.

4. Indexes
   - `idx_opportunities_urgency` — for sorting by urgency
   - `idx_opportunities_monitor_status` — for filtering monitored opportunities

5. Security
   No RLS policy changes. The table already has owner-scoped CRUD policies
   (select_own, insert_own, update_own, delete_own) scoped to `authenticated`
   via `auth.uid() = user_id`. The new columns inherit the same policies.

6. Idempotency
   Each ALTER TABLE uses `ADD COLUMN IF NOT EXISTS`. The CHECK constraint is
   dropped and re-created with `IF EXISTS`.
*/

-- Add missing detail columns
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS award_value TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_regions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS application_url TEXT,
  ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('High', 'Medium', 'Low')),
  ADD COLUMN IF NOT EXISTS monitor_status TEXT CHECK (monitor_status IN ('idle', 'watching', 'changed')),
  ADD COLUMN IF NOT EXISTS monitor_goal TEXT,
  ADD COLUMN IF NOT EXISTS monitor_id TEXT,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS change_summary TEXT;

-- Expand status check constraint to match frontend OpportunityStatus type
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;
ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_status_check
  CHECK (status IN ('saved', 'pending', 'in_progress', 'applied', 'shortlisted', 'rejected', 'awarded', 'filed', 'archived'));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_opportunities_urgency ON opportunities(urgency);
CREATE INDEX IF NOT EXISTS idx_opportunities_monitor_status ON opportunities(monitor_status);