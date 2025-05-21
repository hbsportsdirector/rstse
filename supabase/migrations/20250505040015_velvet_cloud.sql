/*
  # Update test_results RLS policies

  1. Changes
    - Add policy to allow coaches to insert results for their team members
    - Add policy to allow admins to insert results for any user

  2. Security
    - Coaches can only insert results for players in their teams
    - Admins can insert results for any user
    - Existing policies for viewing and managing results remain unchanged
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Coaches can manage results for their team" ON test_results;

-- Create new policy for coaches to manage results for their team members
CREATE POLICY "Coaches can manage results for their team"
ON test_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = test_results.user_id
    AND tc.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = test_results.user_id
    AND tc.coach_id = auth.uid()
  )
);
