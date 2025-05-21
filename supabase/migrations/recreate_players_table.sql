/*
  # Recreate players table

  1. Changes
    - Drop players table if it exists
    - Create players table with proper structure
    - Set up RLS policies correctly
  2. Security
    - Enable RLS on players table
    - Add proper policies with correct syntax
*/

-- Drop the table if it exists
DROP TABLE IF EXISTS players;

-- Create the players table
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  height numeric,
  weight numeric,
  position text,
  profile_image_url text,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies with correct syntax
CREATE POLICY "Players can view their own profile"
  ON players
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

CREATE POLICY "Players can update their own profile"
  ON players
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

CREATE POLICY "Coaches and admins can insert players"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

CREATE POLICY "Coaches and admins can delete players"
  ON players
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND (users.role = 'coach' OR users.role = 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_team_id ON players(team_id);