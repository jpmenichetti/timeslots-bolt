/*
  # Add Cascade Delete for Time Slot Reservations

  ## Overview
  This migration ensures that when a time slot is deleted, all associated reservations
  are automatically removed from the database.

  ## Changes
  
  1. Database Structure
    - Modify the foreign key constraint on reservations.time_slot_id
    - Add CASCADE delete behavior to automatically remove reservations when a time slot is deleted
  
  2. Security
    - Add RLS policy to allow admins to delete time slots (if not exists)
    - Ensures only admins can delete time slots through the application
  
  ## Notes
  - When a time slot is deleted, all associated reservations will be automatically removed
  - This maintains referential integrity and prevents orphaned reservations
  - The cascade happens at the database level, so it's reliable and automatic
*/

-- Drop the existing foreign key constraint
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_time_slot_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE reservations 
ADD CONSTRAINT reservations_time_slot_id_fkey 
FOREIGN KEY (time_slot_id) 
REFERENCES time_slots(id) 
ON DELETE CASCADE;

-- Add RLS policy to allow admins to delete time slots
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'time_slots' 
    AND policyname = 'Admins can delete time slots'
  ) THEN
    CREATE POLICY "Admins can delete time slots"
      ON time_slots FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
