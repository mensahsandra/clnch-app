-- Application chat sessions
CREATE TABLE IF NOT EXISTS application_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID,
  opportunity_title TEXT NOT NULL DEFAULT '',
  opportunity_org TEXT NOT NULL DEFAULT '',
  opportunity_link TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filed', 'archived')),
  last_message_preview TEXT,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE application_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_sessions" ON application_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_sessions" ON application_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_sessions" ON application_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_sessions" ON application_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Anon access for demo mode
CREATE POLICY "anon_insert_sessions" ON application_sessions FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "anon_select_sessions" ON application_sessions FOR SELECT
  TO anon USING (user_id IS NULL);
CREATE POLICY "anon_update_sessions" ON application_sessions FOR UPDATE
  TO anon USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

-- Application answers
CREATE TABLE IF NOT EXISTS application_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES application_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT,
  raw_answer TEXT,
  refined_answer TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE application_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_answers" ON application_answers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_answers" ON application_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_answers" ON application_answers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_answers" ON application_answers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "anon_insert_answers" ON application_answers FOR INSERT
  TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "anon_select_answers" ON application_answers FOR SELECT
  TO anon USING (user_id IS NULL);

-- Indexes
CREATE INDEX idx_sessions_user_id ON application_sessions(user_id);
CREATE INDEX idx_sessions_last_active ON application_sessions(last_active_at DESC);
CREATE INDEX idx_answers_session_id ON application_answers(session_id);
CREATE INDEX idx_answers_created_at ON application_answers(created_at);
