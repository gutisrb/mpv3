/*
  # Fix client authentication and RLS policies

  1. Changes
    - Drop existing RLS policies
    - Add new RLS policies that properly handle auth
    - Update client table constraints
    - Add helper function for auth checks
  
  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Ensure proper email validation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable delete for own client" ON clients;
DROP POLICY IF EXISTS "Enable insert for own client" ON clients;
DROP POLICY IF EXISTS "Enable read access for own client" ON clients;
DROP POLICY IF EXISTS "Enable update for own client" ON clients;

-- Create auth helper function
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update clients table
ALTER TABLE clients ALTER COLUMN email SET NOT NULL;
ALTER TABLE clients ALTER COLUMN name SET NOT NULL;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow users to read own client"
  ON clients
  FOR SELECT
  USING (
    id = auth.uid()
    AND email = get_auth_email()
  );

CREATE POLICY "Allow users to insert own client"
  ON clients
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND email = get_auth_email()
  );

CREATE POLICY "Allow users to update own client"
  ON clients
  FOR UPDATE
  USING (
    id = auth.uid()
    AND email = get_auth_email()
  )
  WITH CHECK (
    id = auth.uid()
    AND email = get_auth_email()
  );

CREATE POLICY "Allow users to delete own client"
  ON clients
  FOR DELETE
  USING (
    id = auth.uid()
    AND email = get_auth_email()
  );