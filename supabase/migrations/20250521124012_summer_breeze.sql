/*
  # Fix Properties RLS Policies

  1. Changes
    - Update RLS policies on properties table to use correct auth.jwt() function
    - Fix policy conditions to properly check user email

  2. Security
    - Maintains RLS enabled on properties table
    - Updates policies to use correct auth function
    - Ensures users can only access their own properties
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Users can read their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;

-- Create new policies with correct auth function
CREATE POLICY "Users can create properties"
ON properties
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Users can delete their own properties"
ON properties
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Users can read their own properties"
ON properties
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Users can update their own properties"
ON properties
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.email = (auth.jwt() ->> 'email'::text)
  )
)
WITH CHECK (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.email = (auth.jwt() ->> 'email'::text)
  )
);