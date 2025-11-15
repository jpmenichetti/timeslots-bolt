/*
  # Add Cascade Delete for Admin User Projects

  1. Changes
    - Modify the foreign key constraint on `projects.created_by` to cascade delete
    - When an admin user is deleted, all projects they created will be automatically deleted
    - This will also cascade to time_slots and reservations through existing cascade rules

  2. Security
    - No RLS changes needed
    - Maintains data integrity by preventing orphaned projects
*/

-- Drop the existing foreign key constraint
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- Add the foreign key constraint back with CASCADE delete
ALTER TABLE projects
ADD CONSTRAINT projects_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE CASCADE;
