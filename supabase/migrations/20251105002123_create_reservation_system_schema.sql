/*
  # Time Slot Reservation System Schema

  ## Overview
  This migration creates a complete reservation system for project time slots with admin and worker roles.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `name` (text, not null)
  - `role` (text, not null, default 'worker')
    - Values: 'admin' or 'worker'
  - `created_at` (timestamptz, default now())

  ### 2. projects
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null)
  - `starting_date` (date, not null)
  - `created_by` (uuid, references profiles.id)
  - `created_at` (timestamptz, default now())

  ### 3. time_slots
  - `id` (uuid, primary key, auto-generated)
  - `project_id` (uuid, references projects.id, cascade delete)
  - `start_time` (timestamptz, not null)
  - `end_time` (timestamptz, not null)
  - `total_seats` (integer, not null, must be positive)
  - `created_at` (timestamptz, default now())

  ### 4. reservations
  - `id` (uuid, primary key, auto-generated)
  - `time_slot_id` (uuid, references time_slots.id, cascade delete)
  - `worker_id` (uuid, references profiles.id)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (time_slot_id, worker_id) - one reservation per worker per slot

  ## Security (Row Level Security)

  ### profiles table
  - Enable RLS
  - Workers can read all profiles
  - Users can update their own profile
  - Profiles are created via trigger on auth.users

  ### projects table
  - Enable RLS
  - All authenticated users can read projects
  - Only admins can insert/update/delete projects

  ### time_slots table
  - Enable RLS
  - All authenticated users can read time slots
  - Only admins can insert/update/delete time slots

  ### reservations table
  - Enable RLS
  - Workers can read all reservations (to check availability)
  - Workers can create reservations for themselves
  - Workers can delete their own reservations
  - Admins can read all reservations

  ## Functions & Triggers

  ### handle_new_user()
  Automatically creates a profile when a new user signs up via auth.users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starting_date date NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_seats integer NOT NULL CHECK (total_seats > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id uuid NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(time_slot_id, worker_id)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "All authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
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

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for time_slots
CREATE POLICY "All authenticated users can view time slots"
  ON time_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create time slots"
  ON time_slots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update time slots"
  ON time_slots FOR UPDATE
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

-- RLS Policies for reservations
CREATE POLICY "All authenticated users can view reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Workers can create their own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can delete their own reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (auth.uid() = worker_id);