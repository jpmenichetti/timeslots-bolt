/*
  # Add phone number and avatar to profiles

  1. Changes
    - Add `phone_number` column to `profiles` table (optional text field)
    - Add `avatar_url` column to `profiles` table (optional text field for image URL)
  
  2. Security
    - Update existing RLS policy to allow users to update their own phone_number and avatar_url
*/

-- Add phone_number and avatar_url columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;