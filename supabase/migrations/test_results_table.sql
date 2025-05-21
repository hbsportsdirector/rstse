/*
  # Create test_results table

  1. New Tables
    - `test_results`
      - `id` (uuid, primary key)
      - `test_id` (uuid, foreign key to physical_tests)
      - `user_id` (uuid, foreign key to users)
      - `date` (date)
      - `metrics` (jsonb)
      - `notes` (text, optional)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `test_results` table
    - Add policies for coaches and admins to manage results
    - Add policy for athletes to view their own results
*/

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES physical_tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Coaches and admins can manage all test results
CREATE POLICY "Coaches and admins can manage test results"
ON test_results
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
)
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = ANY (ARRAY['coach'::text, 'admin'::text])
);

-- Athletes can view their own results
CREATE POLICY "Athletes can view their own results"
ON test_results
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS test_results_test_id_idx ON test_results(test_id);
CREATE INDEX IF NOT EXISTS test_results_user_id_idx ON test_results(user_id);
CREATE INDEX IF NOT EXISTS test_results_date_idx ON test_results(date);