/*
  # Add team creation trigger

  1. Changes
    - Create trigger function to automatically add team creator as coach
    - Add trigger to teams table
    - Ensure team creator is automatically added to team_coaches
    
  2. Security
    - Maintain existing RLS policies
    - Only allow coaches and admins to create teams
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION add_team_creator_as_coach()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the team creator as a coach
  INSERT INTO team_coaches (team_id, coach_id)
  VALUES (NEW.id, auth.uid());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS add_team_creator_as_coach_trigger ON teams;
CREATE TRIGGER add_team_creator_as_coach_trigger
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION add_team_creator_as_coach();
