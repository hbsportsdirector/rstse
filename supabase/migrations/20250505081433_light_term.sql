/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Update RLS policies for workout_program_assignments table to:
      - Allow coaches to create assignments for their teams
      - Maintain admin access to all assignments
      - Keep existing view permissions for players

  2. Security
    - Policies updated to properly check coach team associations
    - Maintains data isolation between teams
    - Preserves admin full access
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Admins can manage all assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Coaches can manage team assignments" ON workout_program_assignments;
DROP POLICY IF EXISTS "Players can view team assignments" ON workout_program_assignments;

-- Recreate policies with correct permissions
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
