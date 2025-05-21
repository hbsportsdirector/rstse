/*
  # Fix learning_tests foreign key relationship

  1. Changes
    - Drop existing foreign key constraint that references auth.users
    - Add new foreign key constraint to reference public.users table
    - This allows joining learning_tests with users table to get creator details

  2. Security
    - Maintains existing RLS policies
    - No changes to security settings required
*/

DO $$ 
BEGIN
  -- Drop the existing foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'learning_tests_created_by_fkey'
  ) THEN
    ALTER TABLE learning_tests DROP CONSTRAINT learning_tests_created_by_fkey;
  END IF;
END $$;

-- Add the new foreign key constraint to reference public.users
ALTER TABLE learning_tests
ADD CONSTRAINT learning_tests_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.users(id)
ON DELETE CASCADE;
