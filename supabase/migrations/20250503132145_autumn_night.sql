/*
  # Update users table RLS policies

  1. Changes
    - Add new RLS policy to allow authenticated users to read user data when referenced by other tables
    
  2. Security
    - Maintains existing RLS policies
    - Adds new policy for reading user data in relationships
    - Does not modify existing data or structure
*/

-- Add policy to allow reading user data when referenced by other tables
CREATE POLICY "Allow reading referenced user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);
