CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  tone_schema TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_voice_profiles" ON voice_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_voice_profiles" ON voice_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_voice_profiles" ON voice_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_voice_profiles" ON voice_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Also allow anon inserts for the demo (no-auth mode)
CREATE POLICY "anon_insert_voice_profiles" ON voice_profiles FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);

CREATE POLICY "anon_select_voice_profiles" ON voice_profiles FOR SELECT
  TO anon USING (user_id IS NULL);

CREATE INDEX idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX idx_voice_profiles_created_at ON voice_profiles(created_at DESC);
