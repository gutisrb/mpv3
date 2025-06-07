/*
  # Add iCal URL fields to properties table

  1. Changes
    - Add `airbnb_ical` column to properties table
    - Add `booking_ical` column to properties table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add iCal URL columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS airbnb_ical text,
ADD COLUMN IF NOT EXISTS booking_ical text;