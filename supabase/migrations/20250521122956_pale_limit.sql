/*
  # Update clients table policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with correct auth checks
    - Add email uniqueness constraint
  
  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Ensure users can only access their own data
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable delete for users based on id" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on id" ON clients;

-- Add unique constraint on email
ALTER TABLE clients ADD CONSTRAINT clients_email_unique UNIQUE (email);

-- Create new policies with correct auth checks
CREATE POLICY "Enable read access for own client"
  ON clients
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for own client"
  ON clients
  FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    auth.jwt()->>'email' = email
  );

CREATE POLICY "Enable update for own client"
  ON clients
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    auth.jwt()->>'email' = email
  );

CREATE POLICY "Enable delete for own client"
  ON clients
  FOR DELETE
  USING (auth.uid() = id);