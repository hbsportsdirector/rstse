/*
  # Add coach_id to teams table

  1. Changes
    - Add `coach_id` column to `teams` table
    - Add foreign key constraint to reference users table
    - Add index on coach_id for better query performance

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
*/

-- Add coach_id column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS teams_coach_id_idx ON teams(coach_id);
