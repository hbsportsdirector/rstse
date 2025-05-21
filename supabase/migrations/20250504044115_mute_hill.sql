/*
  # Create workout logs table

  1. New Tables
    - `workout_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `date` (timestamp)
      - `exercises` (jsonb)
      - `duration` (integer) - in minutes
      - `intensity` (integer) - 1-10 scale
      - `physical_state_rating` (integer) - 1-5 scale
      - `notes` (text)

  2. Security
    - Enable RLS
    - Users can manage their own logs
    - Coaches can view logs for their team members
    - Admins can manage all logs
*/

-- Create workout_logs table
CREATE TABLE workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date timestamptz DEFAULT now(),
  exercises jsonb NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  intensity integer NOT NULL CHECK (intensity BETWEEN 1 AND 10),
  physical_state_rating integer NOT NULL CHECK (physical_state_rating BETWEEN 1 AND 5),
  notes text,
  CONSTRAINT valid_exercises CHECK (jsonb_typeof(exercises) = 'array')
);

-- Enable RLS
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own logs
CREATE POLICY "Users can manage own logs"
  ON workout_logs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches can view logs for their team members
CREATE POLICY "Coaches can view team logs"
  ON workout_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN team_coaches tc ON tc.team_id = u.team_id
      WHERE u.id = workout_logs.user_id
      AND tc.coach_id = auth.uid()
    )
  );

-- Admins can manage all logs
CREATE POLICY "Admins can manage all logs"
  ON workout_logs
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
