/*
  # Add insert policy for test results

  1. Changes
    - Add new RLS policy to allow coaches and admins to insert test results
    - Policy ensures only authorized users can insert results
    - Maintains existing security model while enabling required functionality

  2. Security
    - Policy checks user role (coach or admin)
    - Validates user exists and has appropriate role
    - Maintains data integrity and access control
*/

-- Add policy for inserting test results
CREATE POLICY "Coaches and admins can insert results"
ON public.test_results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('coach', 'admin')
  )
);
