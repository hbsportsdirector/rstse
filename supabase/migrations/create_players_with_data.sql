/*
  # Create players table and insert sample data

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `players` table
    - Add simple policy for all authenticated users
  3. Data
    - Insert sample player records
*/

-- Drop the table if it exists
DROP TABLE IF EXISTS players;

-- Create a simplified players table without foreign keys
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for all authenticated users
CREATE POLICY "All authenticated users can view players"
  ON players
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert players"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert sample players
INSERT INTO players (first_name, last_name)
VALUES 
  ('John', 'Doe'),
  ('Jane', 'Smith'),
  ('Michael', 'Johnson')
ON CONFLICT (id) DO NOTHING;