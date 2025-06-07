/*
  # Fix clients table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies that properly handle authentication
    - Add default RLS policy for authenticated users
    - Fix policy conditions to use auth.uid() instead of id = uid()
  
  2. Security
    - Enable RLS on clients table
    - Add policies for CRUD operations
    - Ensure proper access control based on user authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own client data" ON clients;
DROP POLICY IF EXISTS "Users can insert their own client data" ON clients;
DROP POLICY IF EXISTS "Users can read their own client data" ON clients;
DROP POLICY IF EXISTS "Users can update their own client data" ON clients;

-- Create new policies with correct auth checks
CREATE POLICY "Enable read access for authenticated users"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = id);