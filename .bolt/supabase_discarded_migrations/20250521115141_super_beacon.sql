/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties.id)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `source` (text, not null, one of: 'airbnb', 'booking.com', 'manual', 'web')
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `bookings` table
    - Add policy for authenticated users to read bookings for their properties
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('airbnb', 'booking.com', 'manual', 'web')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure end_date is after start_date
  CONSTRAINT end_date_after_start_date CHECK (end_date > start_date)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user owns a property
CREATE OR REPLACE FUNCTION public.user_owns_property(property_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties
    WHERE id = property_id
    AND client_email = auth.jwt() ->> 'email'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for bookings
CREATE POLICY "Users can read bookings for their properties"
  ON bookings
  FOR SELECT
  USING (user_owns_property(property_id));

CREATE POLICY "Users can insert bookings for their properties"
  ON bookings
  FOR INSERT
  WITH CHECK (user_owns_property(property_id));

CREATE POLICY "Users can update bookings for their properties"
  ON bookings
  FOR UPDATE
  USING (user_owns_property(property_id));

CREATE POLICY "Users can delete bookings for their properties"
  ON bookings
  FOR DELETE
  USING (user_owns_property(property_id));