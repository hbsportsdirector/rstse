/*
  # Add insert policy for test results

  1. Security Changes
    - Add RLS policy to allow users to insert their own test results
    - Policy ensures users can only insert results where they are the user_id
    - Maintains data integrity by preventing users from inserting results for others
*/

CREATE POLICY "Users can insert own results"
ON public.test_results
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
