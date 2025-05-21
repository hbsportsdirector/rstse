/*
  # Add workout program assignments table

  1. Changes
    - Remove week and day columns from workout_programs
    - Add workout_program_assignments table for team assignments
    - Add date range for program assignments
    
  2. Security
    - Enable RLS
    - Allow coaches to manage assignments
    - Allow players to view their assignments
*/

-- Remove week and day columns from workout_programs
ALTER TABLE workout_programs
DROP COLUMN weeks,
DROP COLUMN days_per_week;

-- Create workout program assignments table
CREATE TABLE workout_program_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES workout_programs(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE workout_program_assignments ENABLE ROW LEVEL SECURITY;

-- Add policies for workout program assignments
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
