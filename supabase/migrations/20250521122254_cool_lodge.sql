/*
  # Fix clients table RLS policies

  1. Changes
    - Update RLS policies for clients table to allow proper client creation
    - Add policies for insert, update, and delete operations
    - Ensure policies use auth.uid() for user identification
  
  2. Security
    - Enable RLS on clients table
    - Add policies for all CRUD operations
    - Ensure users can only access their own data
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own client data" ON clients;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add comprehensive RLS policies
CREATE POLICY "Users can read their own client data"
  ON clients
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own client data"
  ON clients
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own client data"
  ON clients
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can delete their own client data"
  ON clients
  FOR DELETE
  USING (id = auth.uid());