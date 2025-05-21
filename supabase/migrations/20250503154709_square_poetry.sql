/*
  # Add RLS policies for teams table

  1. Changes
    - Add RLS policy for admins to manage all teams
    - Add RLS policy for coaches to manage their own teams
    - Add RLS policy for everyone to view teams

  2. Security
    - Enable RLS on teams table (if not already enabled)
    - Admins can perform all operations on all teams
    - Coaches can only manage their own teams
    - All authenticated users can view teams
*/

-- First, ensure RLS is enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Coaches can manage their teams" ON teams;
DROP POLICY IF EXISTS "Everyone can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;

-- Add policy for admins to manage all teams
CREATE POLICY "Admins can manage all teams"
ON teams
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add policy for coaches to manage their own teams
CREATE POLICY "Coaches can manage their teams"
ON teams
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'coach'
    AND users.id = teams.coach_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'coach'
    AND users.id = teams.coach_id
  )
);

-- Add policy for everyone to view teams
CREATE POLICY "Everyone can view teams"
ON teams
FOR SELECT
TO authenticated
USING (true);
