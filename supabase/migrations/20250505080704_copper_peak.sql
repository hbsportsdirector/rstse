/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies that properly handle assignments
    - Fix policy for coaches to manage team assignments
    - Add policy for admins to manage all assignments
    
  2. Security
    - Enable RLS
    - Allow coaches to manage assignments for their teams
    - Allow admins to manage all assignments
    - Allow players to view their team assignments
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can manage team assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Players can view team assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON workout_program_assignments;

-- Create new policies
CREATE POLICY "Admins can manage all assignments"
ON workout_program_assignments
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

CREATE POLICY "Coaches can manage team assignments"
ON workout_program_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_coaches tc
    WHERE tc.team_id = workout_program_assignments.team_id
    AND tc.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_coaches tc
    WHERE tc.team_id = workout_program_assignments.team_id
    AND tc.coach_id = auth.uid()
  )
);

CREATE POLICY "Players can view team assignments"
ON workout_program_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.team_id = workout_program_assignments.team_id
  )
);
