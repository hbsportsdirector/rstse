/*
  # Update teams table to support multiple coaches

  1. Changes
    - Create team_coaches junction table
    - Update RLS policies to handle multiple coaches
    - Preserve existing relationships
    - Handle dependent policies properly
  
  2. Security
    - Maintain RLS on all tables
    - Update policies to reflect new structure
    - Preserve existing access controls
*/

-- Create team_coaches junction table
CREATE TABLE team_coaches (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, coach_id)
);

-- Enable RLS on the new table
ALTER TABLE team_coaches ENABLE ROW LEVEL SECURITY;

-- First, drop the dependent policies
DROP POLICY IF EXISTS "Coaches can manage team members" ON users;
DROP POLICY IF EXISTS "Coaches can manage their teams" ON teams;

-- Migrate existing coach relationships
INSERT INTO team_coaches (team_id, coach_id)
SELECT id, coach_id
FROM teams
WHERE coach_id IS NOT NULL;

-- Now we can safely drop the coach_id column
ALTER TABLE teams DROP COLUMN coach_id;

-- Update RLS policies for teams table
DROP POLICY IF EXISTS "Admins can manage all teams" ON teams;
DROP POLICY IF EXISTS "Everyone can view teams" ON teams;

-- Add updated policies for teams
CREATE POLICY "Admins can manage all teams"
ON teams
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

CREATE POLICY "Coaches can manage their teams"
ON teams
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_coaches
    WHERE team_coaches.team_id = teams.id
    AND team_coaches.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'coach'
  )
);

CREATE POLICY "Everyone can view teams"
ON teams
FOR SELECT
TO authenticated
USING (true);

-- Add policies for team_coaches table
CREATE POLICY "Admins can manage all team coaches"
ON team_coaches
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

CREATE POLICY "Coaches can view team assignments"
ON team_coaches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'coach'
  )
);

CREATE POLICY "Coaches can manage their own team assignments"
ON team_coaches
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'coach'
  )
);

-- Recreate the policy for managing team members with new logic
CREATE POLICY "Coaches can manage team members"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_coaches
    WHERE team_coaches.team_id = users.team_id
    AND team_coaches.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_coaches
    WHERE team_coaches.team_id = users.team_id
    AND team_coaches.coach_id = auth.uid()
  )
);
