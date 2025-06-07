/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `location` (text, not null)
      - `client_email` (text, not null)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `properties` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  client_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own properties"
  ON properties
  FOR SELECT
  USING (auth.jwt() ->> 'email' = client_email);

CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = client_email);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = client_email);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  USING (auth.jwt() ->> 'email' = client_email);