/*
  # Fix table case sensitivity

  1. Changes
    - Rename "Properties" table to "properties" (lowercase)
    - Rename "Bookings" table to "bookings" (lowercase)
    - Rename "Clients" table to "clients" (lowercase)
    - Update foreign key constraints to use new table names
  
  2. Security
    - Re-enable RLS on renamed tables
    - Add basic RLS policies for data access
*/

-- Rename tables to lowercase
ALTER TABLE IF EXISTS "Properties" RENAME TO properties;
ALTER TABLE IF EXISTS "Bookings" RENAME TO bookings;
ALTER TABLE IF EXISTS "Clients" RENAME TO clients;

-- Re-enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read their own properties"
ON properties
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Users can read their own bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE client_id = auth.uid()
  )
);

CREATE POLICY "Users can read their own client data"
ON clients
FOR SELECT
TO authenticated
USING (id = auth.uid());