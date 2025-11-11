/*
  # Add User Blocking Functionality

  ## Overview
  This migration adds the ability for admins to block users from logging in.

  ## Changes
  
  1. Schema Changes
    - Add `is_blocked` column to profiles table
    - Defaults to false for all users
    - Admins can toggle this status to prevent user access
  
  2. Security
    - Add RLS policy to allow admins to update the is_blocked status
    - Blocked users cannot access the application
  
  ## Notes
  - Blocking a user prevents them from logging in
  - Existing sessions are not immediately terminated (they will be blocked on next login)
  - Only admins can block/unblock users
*/

-- Add is_blocked column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_blocked boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add RLS policy to allow admins to update user blocked status
CREATE POLICY "Admins can update user blocked status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
