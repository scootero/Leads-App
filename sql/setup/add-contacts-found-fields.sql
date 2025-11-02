-- Add contacts_found fields to lead_results table
-- Run this in your Supabase SQL editor

-- Add contacts_found column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'contacts_found') THEN
    ALTER TABLE lead_results ADD COLUMN contacts_found BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added contacts_found column to lead_results';
  ELSE
    RAISE NOTICE 'contacts_found column already exists in lead_results';
  END IF;
END $$;

-- Add contacts_found_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'contacts_found_at') THEN
    ALTER TABLE lead_results ADD COLUMN contacts_found_at TIMESTAMPTZ;
    RAISE NOTICE 'Added contacts_found_at column to lead_results';
  ELSE
    RAISE NOTICE 'contacts_found_at column already exists in lead_results';
  END IF;
END $$;

-- Add last_used_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'last_used_at') THEN
    ALTER TABLE lead_results ADD COLUMN last_used_at TIMESTAMPTZ;
    RAISE NOTICE 'Added last_used_at column to lead_results';
  ELSE
    RAISE NOTICE 'last_used_at column already exists in lead_results';
  END IF;
END $$;

-- Verify the changes
SELECT
  'lead_results' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_results'
  AND column_name IN ('contacts_found', 'contacts_found_at', 'last_used_at')
ORDER BY ordinal_position;

-- Update existing records that have contacts
UPDATE lead_results lr
SET
  contacts_found = EXISTS (
    SELECT 1 FROM company_contacts cc WHERE cc.lead_result_id = lr.id
  ),
  contacts_found_at = (
    SELECT MIN(created_at)
    FROM company_contacts cc
    WHERE cc.lead_result_id = lr.id
  )
WHERE NOT contacts_found;

-- Show updated records
SELECT
  id,
  company_name,
  contacts_found,
  contacts_found_at,
  sent_to_customer,
  sent_at,
  times_used,
  last_used_at
FROM lead_results
WHERE contacts_found = true
LIMIT 10;
