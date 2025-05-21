/*
  # Fix team assignment permissions

  1. Changes
    - Drop existing policies that allowed coaches to manage team assignments
    - Create new policy that only allows admins to update team assignments
    - Allow users to update their own data except team_id
    
  2. Security
    - Only admins can assign users to teams
    - Users can update their own profile data but not team assignment
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Coaches can manage team members" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can update own data except team" ON users;
DROP POLICY IF EXISTS "Admins can update team assignments" ON users;

-- Create new policies
CREATE POLICY "Users can update own non-team data"
ON users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  AND role = ANY (ARRAY['player'::text, 'coach'::text])
)
WITH CHECK (
  id = auth.uid()
  AND role = ANY (ARRAY['player'::text, 'coach'::text])
  AND team_id IS NULL -- Prevent users from setting their own team
);

CREATE POLICY "Admins can update all user data"
ON users
FOR UPDATE
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
