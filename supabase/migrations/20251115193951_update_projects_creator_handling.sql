/*
  # Update Projects Creator Handling

  1. Changes
    - Add `creator_email` field to `projects` table to preserve the original creator's email
    - Modify the foreign key constraint on `projects.created_by` to SET NULL on delete instead of CASCADE
    - When an admin user is deleted, projects remain but the `created_by` field becomes NULL
    - The `creator_email` field preserves the original creator information

  2. Notes
    - Existing projects will have NULL creator_email initially (can be populated if needed)
    - New projects will store the creator's email
*/

-- Add creator_email field to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'creator_email'
  ) THEN
    ALTER TABLE projects ADD COLUMN creator_email text;
  END IF;
END $$;

-- Drop the existing foreign key constraint
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- Make created_by nullable if it isn't already
ALTER TABLE projects
ALTER COLUMN created_by DROP NOT NULL;

-- Add the foreign key constraint back with SET NULL on delete
ALTER TABLE projects
ADD CONSTRAINT projects_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE SET NULL;
