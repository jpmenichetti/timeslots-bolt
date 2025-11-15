/*
  # Fix Security and Performance Issues

  ## Changes

  ### 1. Add Missing Indexes for Foreign Keys
    - Add index on `projects.created_by` for foreign key lookup performance
    - Add index on `time_slots.project_id` for foreign key lookup performance
    - Add index on `reservations.worker_id` for foreign key lookup performance
    - Note: `reservations.time_slot_id` already has an index from the unique constraint

  ### 2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale

  ### 3. Consolidate Multiple UPDATE Policies on Profiles
    - Merge "Users can update own profile" and "Admins can update user blocked status" into a single policy
    - This resolves the multiple permissive policies warning

  ## Security
    - All security constraints remain unchanged
    - Performance is improved without reducing security
*/

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_time_slots_project_id ON time_slots(project_id);
CREATE INDEX IF NOT EXISTS idx_reservations_worker_id ON reservations(worker_id);

-- Drop existing RLS policies that need optimization
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user blocked status" ON profiles;
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Admins can create time slots" ON time_slots;
DROP POLICY IF EXISTS "Admins can update time slots" ON time_slots;
DROP POLICY IF EXISTS "Admins can delete time slots" ON time_slots;
DROP POLICY IF EXISTS "Workers can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Workers can delete their own reservations" ON reservations;

-- Recreate profiles UPDATE policy (consolidated)
CREATE POLICY "Users can update own profile or admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Recreate profiles DELETE policy (optimized)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Recreate projects policies (optimized)
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Recreate time_slots policies (optimized)
CREATE POLICY "Admins can create time slots"
  ON time_slots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update time slots"
  ON time_slots FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete time slots"
  ON time_slots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Recreate reservations policies (optimized)
CREATE POLICY "Workers can create their own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = worker_id);

CREATE POLICY "Workers can delete their own reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = worker_id);
