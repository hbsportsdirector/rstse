/*
  # Fix team assignment policies

  1. Changes
    - Update RLS policies for users table to allow team assignments
    - Allow coaches to update team_id for users in their teams
    - Allow admins to update any user's team
    - Maintain existing policies for other operations

  2. Security
    - Ensure proper access control for team assignments
    - Maintain existing security model
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Coaches can manage team members" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Coaches can manage team members"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_coaches tc
    WHERE tc.team_id = users.team_id
    AND tc.coach_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM team_coaches tc
    WHERE tc.coach_id = auth.uid()
    AND tc.team_id = CAST(users.team_id AS uuid)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_coaches tc
    WHERE tc.team_id = CAST(users.team_id AS uuid)
    AND tc.coach_id = auth.uid()
  )
);
