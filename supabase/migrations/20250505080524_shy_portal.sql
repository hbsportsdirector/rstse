/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Update RLS policies for workout_program_assignments table to properly handle insertions
    - Ensure coaches can create assignments for their teams
    - Ensure admins maintain full control
    
  2. Security
    - Maintain existing read permissions
    - Add proper insert permissions for coaches and admins
    - Verify team association for coaches
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage all assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Coaches can manage team assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Players can view team assignments" ON workout_program_assignments;

-- Recreate policies with proper permissions
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
