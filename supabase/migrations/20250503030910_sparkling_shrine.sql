/*
  # Fix column names in users table

  1. Changes
    - Rename 'createdat' to 'created_at' for consistency
    - Rename 'firstname' to 'first_name'
    - Rename 'lastname' to 'last_name'
    - Rename 'teamid' to 'team_id'
    - Rename 'profileimageurl' to 'profile_image_url'
    
  2. Security
    - No changes to existing policies
*/

ALTER TABLE users RENAME COLUMN createdat TO created_at;
ALTER TABLE users RENAME COLUMN firstname TO first_name;
ALTER TABLE users RENAME COLUMN lastname TO last_name;
ALTER TABLE users RENAME COLUMN teamid TO team_id;
ALTER TABLE users RENAME COLUMN profileimageurl TO profile_image_url;
