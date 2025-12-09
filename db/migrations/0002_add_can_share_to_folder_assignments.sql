
-- Add can_share column to folder_assignments table
ALTER TABLE folder_assignments ADD COLUMN IF NOT EXISTS can_share BOOLEAN DEFAULT FALSE;
