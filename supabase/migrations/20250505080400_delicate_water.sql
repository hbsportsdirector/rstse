/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Update RLS policies for workout_program_assignments table to allow coaches to create assignments for their teams
    - Ensure admins can create assignments for any team
    - Maintain existing policies for viewing assignments

  2. Security
    - Enable RLS on workout_program_assignments table
    - Add policy for coaches to create assignments for their teams
    - Add policy for admins to manage all assignments
    - Keep existing policy for players to view their team assignments
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
