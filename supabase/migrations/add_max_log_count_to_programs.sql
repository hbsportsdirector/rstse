/*
  # Add maximum log count to workout programs

  1. Changes
    - Add max_log_count column to workout_programs table
    - Add log_count column to program_user_progress table
    
  2. Purpose
    - Allow setting a maximum number of times athletes can log results for a program
    - Track how many times each user has logged results for a program
    - Enable enforcing limits on workout logging
*/

-- Add max_log_count to workout_programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_programs' AND column_name = 'max_log_count'
  ) THEN
    ALTER TABLE workout_programs ADD COLUMN max_log_count INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Create program_user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS program_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_count INTEGER NOT NULL DEFAULT 0,
  last_logged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

-- Enable RLS on program_user_progress
ALTER TABLE program_user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for program_user_progress
CREATE POLICY "Users can view their own progress"
  ON program_user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON program_user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches and admins can view all progress"
  ON program_user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );