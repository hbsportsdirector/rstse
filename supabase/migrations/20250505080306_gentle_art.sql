/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Add INSERT permission to existing policy for coaches managing team assignments
    - Add policy for admins to manage all assignments

  2. Security
    - Coaches can manage assignments for their teams
    - Admins can manage all assignments
    - Players can only view assignments for their team
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Coaches can manage team assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Players can view team assignments" ON workout_program_assignments;

-- Recreate policies with correct permissions
CREATE POLICY "Coaches can manage team assignments"
ON workout_program_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_coaches
    WHERE team_coaches.team_id = workout_program_assignments.team_id
    AND team_coaches.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_coaches
    WHERE team_coaches.team_id = workout_program_assignments.team_id
    AND team_coaches.coach_id = auth.uid()
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
