/*
  # Check and recreate teams table if needed

  1. Changes
    - Check if teams table exists, create if it doesn't
    - Set up RLS policies correctly
  2. Security
    - Enable RLS on teams table
    - Add proper policies with correct syntax
*/

-- Create the teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "All authenticated users can view teams" ON teams;
DROP POLICY IF EXISTS "Coaches and admins can insert teams" ON teams;
DROP POLICY IF EXISTS "Coaches and admins can update teams" ON teams;
DROP POLICY IF EXISTS "Coaches and admins can delete teams" ON teams;

-- Create policies with correct syntax
CREATE POLICY "All authenticated users can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches and admins can insert teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

CREATE POLICY "Coaches and admins can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

CREATE POLICY "Coaches and admins can delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );