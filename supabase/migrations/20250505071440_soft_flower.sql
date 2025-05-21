/*
  # Add workout programs schema

  1. New Tables
    - `workout_programs`
      - Program definitions with schedule and target groups
    - `program_exercises`
      - Exercise details for each program
    
  2. Security
    - Enable RLS
    - Add policies for program management
    - Allow viewing of programs
*/

-- Create workout_programs table
CREATE TABLE workout_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  target_groups text[] NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  weeks integer NOT NULL CHECK (weeks > 0),
  days_per_week integer NOT NULL CHECK (days_per_week BETWEEN 1 AND 7)
);

-- Create program_exercises table
CREATE TABLE program_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES workout_programs(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number > 0),
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  sets integer NOT NULL CHECK (sets > 0),
  reps text NOT NULL, -- Can be "5-8" or just "5"
  rest_seconds integer NOT NULL CHECK (rest_seconds > 0),
  tempo text, -- e.g., "3-1-2-0" for eccentric-bottom-concentric-top
  notes text,
  order_index integer NOT NULL
);

-- Enable RLS
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;

-- Add policies for workout_programs
CREATE POLICY "Coaches and admins can manage programs"
ON workout_programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('coach', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('coach', 'admin')
  )
);

CREATE POLICY "Everyone can view programs"
ON workout_programs
FOR SELECT
TO authenticated
USING (true);

-- Add policies for program_exercises
CREATE POLICY "Coaches and admins can manage program exercises"
ON program_exercises
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workout_programs wp
    JOIN users u ON u.id = wp.created_by
    WHERE wp.id = program_exercises.program_id
    AND u.role IN ('coach', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_programs wp
    JOIN users u ON u.id = wp.created_by
    WHERE wp.id = program_exercises.program_id
    AND u.role IN ('coach', 'admin')
  )
);

CREATE POLICY "Everyone can view program exercises"
ON program_exercises
FOR SELECT
TO authenticated
USING (true);
