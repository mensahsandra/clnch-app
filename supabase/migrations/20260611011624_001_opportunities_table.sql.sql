CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_opportunities" ON opportunities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_opportunities" ON opportunities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_opportunities" ON opportunities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_opportunities" ON opportunities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
