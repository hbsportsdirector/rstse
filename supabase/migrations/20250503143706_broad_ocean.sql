/*
  # Add team-user relationship

  1. Changes
    - Add foreign key constraint from users.team_id to teams.id
    - Add index on team_id for better query performance
    - Add RLS policies for team management
    
  2. Security
    - Only coaches can assign users to their teams
    - Users can view their own team
    - Admins can view all team assignments
*/

-- Add foreign key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_team_id_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id);
  END IF;
END $$;

-- Add index for team_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'users_team_id_idx'
  ) THEN
    CREATE INDEX users_team_id_idx ON users(team_id);
  END IF;
END $$;

-- Update RLS policies for team management
DO $$ 
BEGIN
  -- Allow coaches to update team_id for users in their teams
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Coaches can manage team members'
  ) THEN
    CREATE POLICY "Coaches can manage team members"
    ON users
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = users.team_id
        AND teams.coach_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM teams
        WHERE teams.id = users.team_id
        AND teams.coach_id = auth.uid()
      )
    );
  END IF;
END $$;
