/*
  # Physical Tests Schema

  1. New Tables
    - `physical_tests`
      - Test definitions with metrics and instructions
    - `workout_groups`
      - Groups based on test performance
    
  2. Security
    - Enable RLS
    - Add policies for test management
    - Allow viewing of tests and groups
*/

-- Create physical_tests table if not exists
CREATE TABLE IF NOT EXISTS physical_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('strength', 'speed', 'endurance', 'agility', 'power')),
  metrics jsonb NOT NULL,
  equipment text[] DEFAULT '{}',
  instructions text[] NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_club_test boolean DEFAULT false,
  CONSTRAINT valid_metrics CHECK (
    jsonb_typeof(metrics) = 'array' AND
    jsonb_array_length(metrics) > 0
  )
);

-- Drop and recreate test_results table
DROP TABLE IF EXISTS test_results CASCADE;
CREATE TABLE test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES physical_tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date timestamptz DEFAULT now(),
  metrics jsonb NOT NULL,
  notes text,
  CONSTRAINT valid_result_metrics CHECK (jsonb_typeof(metrics) = 'object')
);

-- Create workout_groups table if not exists
CREATE TABLE IF NOT EXISTS workout_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_criteria CHECK (jsonb_typeof(criteria) = 'object')
);

-- Enable RLS
ALTER TABLE physical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Coaches and admins can manage tests" ON physical_tests;
DROP POLICY IF EXISTS "Only admins can create club tests" ON physical_tests;
DROP POLICY IF EXISTS "Everyone can view tests" ON physical_tests;
DROP POLICY IF EXISTS "Users can view own results" ON test_results;
DROP POLICY IF EXISTS "Coaches can manage results for their team" ON test_results;
DROP POLICY IF EXISTS "Admins can manage all results" ON test_results;
DROP POLICY IF EXISTS "Coaches can manage groups for their teams" ON workout_groups;
DROP POLICY IF EXISTS "Admins can manage all groups" ON workout_groups;
DROP POLICY IF EXISTS "Everyone can view groups" ON workout_groups;

-- Policies for physical_tests
CREATE POLICY "Coaches and admins can manage tests"
  ON physical_tests
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
  );

CREATE POLICY "Only admins can create club tests"
  ON physical_tests
  FOR ALL
  TO authenticated
  USING (
    (NOT is_club_test) OR
    (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  )
  WITH CHECK (
    (NOT is_club_test) OR
    (is_club_test AND (auth.jwt() ->> 'role'::text) = 'admin'::text)
  );

CREATE POLICY "Everyone can view tests"
  ON physical_tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for test_results
CREATE POLICY "Users can view own results"
  ON test_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can manage results for their team"
  ON test_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN team_coaches tc ON tc.team_id = u.team_id
      WHERE u.id = test_results.user_id
      AND tc.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN team_coaches tc ON tc.team_id = u.team_id
      WHERE u.id = test_results.user_id
      AND tc.coach_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all results"
  ON test_results
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Policies for workout_groups
CREATE POLICY "Coaches can manage groups for their teams"
  ON workout_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_coaches
      WHERE team_coaches.team_id = workout_groups.team_id
      AND team_coaches.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_coaches
      WHERE team_coaches.team_id = workout_groups.team_id
      AND team_coaches.coach_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all groups"
  ON workout_groups
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Everyone can view groups"
  ON workout_groups
  FOR SELECT
  TO authenticated
  USING (true);
