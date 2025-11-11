/*
  # Fix Profile Creation Policy

  ## Changes
  - Add INSERT policy for profiles table to allow the trigger function to create profiles
  - The SECURITY DEFINER function needs a policy that allows inserting new profiles
*/

-- Allow the trigger function to insert new profiles
CREATE POLICY "Allow profile creation on signup"
  ON profiles FOR INSERT
  WITH CHECK (true);
