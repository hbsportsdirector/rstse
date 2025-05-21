/*
  # Fix RLS policies for players table

  1. Changes
    - Fix INSERT policy syntax for players table
    - Replace USING with WITH CHECK for INSERT policies
  2. Security
    - Maintain same security rules but with correct syntax
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Coaches and admins can insert players" ON players;

-- Create the corrected policy with WITH CHECK instead of USING
CREATE POLICY "Coaches and admins can insert players"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );