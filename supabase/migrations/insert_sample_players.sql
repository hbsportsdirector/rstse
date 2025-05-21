/*
  # Insert sample players

  1. Purpose
    - Add sample data to the players table
    - Test if the table is working correctly
*/

-- Insert sample players
INSERT INTO players (first_name, last_name)
VALUES 
  ('John', 'Doe'),
  ('Jane', 'Smith'),
  ('Michael', 'Johnson')
ON CONFLICT (id) DO NOTHING;