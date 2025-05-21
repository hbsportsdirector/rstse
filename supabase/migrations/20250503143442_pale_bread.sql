/*
  # Add teams table and sample data

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `coach_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for team management
    - Allow public viewing of teams
*/

-- Create teams table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'teams'
  ) THEN
    CREATE TABLE teams (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      coach_id uuid REFERENCES auth.users(id)
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' 
    AND policyname = 'Coaches can manage their teams'
  ) THEN
    CREATE POLICY "Coaches can manage their teams"
      ON teams
      FOR ALL
      TO authenticated
      USING (coach_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' 
    AND policyname = 'Everyone can view teams'
  ) THEN
    CREATE POLICY "Everyone can view teams"
      ON teams
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert sample teams if they don't exist
INSERT INTO teams (name, description)
SELECT 'Junior Team', 'Team for players under 18'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Junior Team');

INSERT INTO teams (name, description)
SELECT 'Senior Team', 'Main competitive team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Senior Team');

INSERT INTO teams (name, description)
SELECT 'Development Squad', 'Training and development focused team'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Development Squad');
