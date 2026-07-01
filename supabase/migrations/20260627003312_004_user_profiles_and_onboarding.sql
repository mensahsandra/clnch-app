/*
# Add user_profiles and onboarding tables

1. New Tables
- `user_profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, unique, not null)
  - `full_name` (text)
  - `preferred_name` (text)
  - `background` (text)
  - `role_type` (text)
  - `goals` (text)
  - `opportunity_types` (text[])
  - `theme` (text, default 'warm')
  - `onboarding_completed` (boolean, default false)
  - `onboarding_step` (integer, default 0)
  - `extension_installed` (boolean, default false)
  - `spotlight_tour_completed` (boolean, default false)
  - `spotlight_tour_step` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- `user_tips`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, not null)
  - `tip_id` (text, not null)
  - `dismissed` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (user_id, tip_id)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD policies on user_profiles.
- Owner-scoped CRUD policies on user_tips.
- Create indexes for user_id lookups.

3. Important Notes
- `user_id` has `DEFAULT auth.uid()` so inserts from the frontend succeed without explicit user_id.
- The user_profiles table is created automatically via a trigger on auth.users sign-up.
- `user_tips` tracks which contextual tips each user has dismissed.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_name TEXT,
  background TEXT,
  role_type TEXT,
  goals TEXT,
  opportunity_types TEXT[] DEFAULT '{}',
  theme TEXT DEFAULT 'warm',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  extension_installed BOOLEAN NOT NULL DEFAULT false,
  spotlight_tour_completed BOOLEAN NOT NULL DEFAULT false,
  spotlight_tour_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TABLE IF NOT EXISTS user_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id TEXT NOT NULL,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tip_id)
);

ALTER TABLE user_tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tips" ON user_tips;
CREATE POLICY "select_own_tips" ON user_tips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tips" ON user_tips;
CREATE POLICY "insert_own_tips" ON user_tips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tips" ON user_tips;
CREATE POLICY "update_own_tips" ON user_tips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tips" ON user_tips;
CREATE POLICY "delete_own_tips" ON user_tips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_tips_user_id ON user_tips(user_id);

-- Trigger function to create user_profile on auth.users sign-up
-- SECURITY DEFINER with row_security = off: the function runs as the owner
-- of the user_profiles table, which bypasses RLS so the INSERT can succeed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  INSERT INTO public.user_profiles (user_id, onboarding_completed, onboarding_step)
  VALUES (NEW.id, false, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
