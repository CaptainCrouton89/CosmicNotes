-- Migration to remove 'other' from note_zone enum and update existing data

-- First, update any existing notes with zone='other' to zone='personal' (default)
UPDATE cosmic_memory 
SET zone = 'personal' 
WHERE zone = 'other';

-- Create a new enum without 'other'
CREATE TYPE note_zone_new AS ENUM ('personal', 'work');

-- Update the table to use the new enum
ALTER TABLE cosmic_memory 
ALTER COLUMN zone TYPE note_zone_new 
USING zone::text::note_zone_new;

-- Drop the old enum and rename the new one
DROP TYPE note_zone;
ALTER TYPE note_zone_new RENAME TO note_zone;