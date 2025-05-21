/*
  # Add team coach relation for Dam team

  1. Changes
    - Insert team coach relation for Dam team
    - Ensure proper relationship between coach and team
    
  2. Security
    - No changes to existing policies
    - Maintain existing permissions
*/

-- First, get the team ID for the Dam team and insert the relation
DO $$ 
DECLARE
  dam_team_id uuid;
  coach_user_id uuid;
BEGIN
  -- Get the Dam team ID
  SELECT id INTO dam_team_id
  FROM teams
  WHERE name = 'Dam';

  -- Get the coach user ID
  SELECT id INTO coach_user_id
  FROM users
  WHERE email = 'coach@coach.se';

  -- Insert the team_coaches relation if it doesn't exist
  IF dam_team_id IS NOT NULL AND coach_user_id IS NOT NULL THEN
    INSERT INTO team_coaches (team_id, coach_id)
    VALUES (dam_team_id, coach_user_id)
    ON CONFLICT (team_id, coach_id) DO NOTHING;
  END IF;
END $$;
