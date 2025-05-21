/*
  # Fix workout program assignments RLS policies

  1. Changes
    - Add INSERT permission to the existing "Coaches can manage team assignments" policy
    - Ensure policy covers both existing and new assignments
    - Policy checks that the user is a coach for the team they're assigning to

  2. Security
    - Maintains existing RLS enforcement
    - Only allows coaches to assign programs to teams they manage
    - Preserves existing read permissions for players
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Coaches can manage team assignments" ON workout_program_assignments;

-- Create updated policy that explicitly allows INSERT
CREATE POLICY "Coaches can manage team assignments"
ON workout_program_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM team_coaches 
    WHERE team_coaches.team_id = workout_program_assignments.team_id 
    AND team_coaches.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM team_coaches 
    WHERE team_coaches.team_id = workout_program_assignments.team_id 
    AND team_coaches.coach_id = auth.uid()
  )
);
