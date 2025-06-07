/*
  # Add location column to properties table

  1. Changes
    - Add `location` column to `properties` table
      - Type: text
      - Nullable: true (to maintain compatibility with existing records)

  2. Notes
    - Uses DO block to safely add column if it doesn't exist
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'location'
  ) THEN 
    ALTER TABLE properties ADD COLUMN location text;
  END IF;
END $$;