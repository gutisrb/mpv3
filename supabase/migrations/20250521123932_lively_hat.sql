/*
  # Fix Properties RLS Policies

  1. Changes
    - Update RLS policy for properties table to correctly handle client relationships
    - Add policies for INSERT, UPDATE, and DELETE operations
    - Ensure policies use correct auth checks

  2. Security
    - Enable RLS on properties table (already enabled)
    - Update SELECT policy to use correct client relationship
    - Add proper policies for other operations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can read their own properties" ON properties;

-- Create new SELECT policy that properly checks client relationship
CREATE POLICY "Users can read their own properties"
ON properties
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Add INSERT policy
CREATE POLICY "Users can create properties"
ON properties
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Add UPDATE policy
CREATE POLICY "Users can update their own properties"
ON properties
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Add DELETE policy
CREATE POLICY "Users can delete their own properties"
ON properties
FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE email = auth.jwt() ->> 'email'
  )
);