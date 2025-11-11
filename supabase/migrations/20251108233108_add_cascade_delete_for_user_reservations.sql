/*
  # Add Cascade Delete for User Reservations

  ## Overview
  This migration ensures that when a user (profile) is deleted, all their reservations
  are automatically removed from the database.

  ## Changes
  
  1. Database Structure
    - Modify the foreign key constraint on reservations.worker_id
    - Add CASCADE delete behavior to automatically remove reservations when a profile is deleted
  
  2. Security
    - Add RLS policy to allow admins to delete any profile
    - Ensures only admins can delete users through the application
  
  ## Notes
  - When a profile is deleted, all associated reservations will be automatically removed
  - This maintains referential integrity and prevents orphaned reservations
  - The cascade happens at the database level, so it's reliable and automatic
*/

-- Drop the existing foreign key constraint
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_worker_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE reservations 
ADD CONSTRAINT reservations_worker_id_fkey 
FOREIGN KEY (worker_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Add RLS policy to allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
