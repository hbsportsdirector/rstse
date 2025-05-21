/*
  # Add updated fields to workout program assignments

  1. Changes
    - Add updated_by and updated_at columns to workout_program_assignments table
    
  2. Purpose
    - Track who last updated an assignment and when
    - Support audit trail for program assignment changes
*/

-- Add updated_by and updated_at columns to workout_program_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_program_assignments' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE workout_program_assignments ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_program_assignments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE workout_program_assignments ADD COLUMN updated_at TIMESTAMPTZ;
  END IF;
END $$;