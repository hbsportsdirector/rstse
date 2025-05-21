/*
  # Add workout assignments table

  1. New Tables
    - `workout_assignments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `coach_id` (uuid, references users)
      - `exercises` (jsonb)
      - `due_date` (timestamp)
      - `notes` (text)
      - `completed` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Coaches can assign workouts to their team members
    - Players can view their assignments
    - Players can mark assignments as completed
*/

CREATE TABLE workout_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exercises jsonb NOT NULL,
  due_date timestamptz,
  notes text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_exercises CHECK (jsonb_typeof(exercises) = 'array')
);

-- Enable RLS
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage assignments for their team members
CREATE POLICY "Coaches can manage team assignments"
ON workout_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = workout_assignments.user_id
    AND tc.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN team_coaches tc ON tc.team_id = u.team_id
    WHERE u.id = workout_assignments.user_id
    AND tc.coach_id = auth.uid()
  )
);

-- Players can view their assignments
CREATE POLICY "Players can view own assignments"
ON workout_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Players can update their assignments (to mark as completed)
CREATE POLICY "Players can update own assignments"
ON workout_assignments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
