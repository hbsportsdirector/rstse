/*
  # Create exercises table

  1. New Tables
    - `exercises`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `muscle_groups` (text[])
      - `difficulty` (text)
      - `equipment` (text[])
      - `image_url` (text)
      - `video_url` (text)
      - `instructions` (text[])
      - `created_by` (uuid)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for exercise management
    - Allow public viewing of exercises
*/

-- Create exercises table
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  muscle_groups text[] NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment text[] DEFAULT '{}',
  image_url text,
  video_url text,
  instructions text[] NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT exercises_name_unique UNIQUE (name)
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Coaches and admins can manage exercises"
ON exercises
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

CREATE POLICY "Everyone can view exercises"
ON exercises
FOR SELECT
TO authenticated
USING (true);
