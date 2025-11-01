-- Enhance lead_results and lead_submissions tables
-- This script adds the necessary columns for contact enrichment

-- 1. Add contact enrichment status fields to lead_submissions
DO $$
BEGIN
  -- Add contacts_enriched column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_submissions' AND column_name = 'contacts_enriched') THEN
    ALTER TABLE lead_submissions ADD COLUMN contacts_enriched BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added contacts_enriched column to lead_submissions';
  ELSE
    RAISE NOTICE 'contacts_enriched column already exists in lead_submissions';
  END IF;

  -- Add contacts_enriched_at column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_submissions' AND column_name = 'contacts_enriched_at') THEN
    ALTER TABLE lead_submissions ADD COLUMN contacts_enriched_at TIMESTAMPTZ;
    RAISE NOTICE 'Added contacts_enriched_at column to lead_submissions';
  ELSE
    RAISE NOTICE 'contacts_enriched_at column already exists in lead_submissions';
  END IF;

  -- Add contacts_enrichment_error column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_submissions' AND column_name = 'contacts_enrichment_error') THEN
    ALTER TABLE lead_submissions ADD COLUMN contacts_enrichment_error TEXT;
    RAISE NOTICE 'Added contacts_enrichment_error column to lead_submissions';
  ELSE
    RAISE NOTICE 'contacts_enrichment_error column already exists in lead_submissions';
  END IF;
END $$;

-- 2. Add tracking fields to lead_results
DO $$
BEGIN
  -- Add sent_to_customer column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'sent_to_customer') THEN
    ALTER TABLE lead_results ADD COLUMN sent_to_customer BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added sent_to_customer column to lead_results';
  ELSE
    RAISE NOTICE 'sent_to_customer column already exists in lead_results';
  END IF;

  -- Add sent_at column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'sent_at') THEN
    ALTER TABLE lead_results ADD COLUMN sent_at TIMESTAMPTZ;
    RAISE NOTICE 'Added sent_at column to lead_results';
  ELSE
    RAISE NOTICE 'sent_at column already exists in lead_results';
  END IF;

  -- Add times_used column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'times_used') THEN
    ALTER TABLE lead_results ADD COLUMN times_used INT DEFAULT 0;
    RAISE NOTICE 'Added times_used column to lead_results';
  ELSE
    RAISE NOTICE 'times_used column already exists in lead_results';
  END IF;
END $$;

-- 3. Create index on lead_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lead_results_sent') THEN
    CREATE INDEX idx_lead_results_sent ON lead_results(sent_to_customer);
    RAISE NOTICE 'Created idx_lead_results_sent index';
  ELSE
    RAISE NOTICE 'idx_lead_results_sent index already exists';
  END IF;
END $$;

-- 4. Create increment function
DO $$
BEGIN
  EXECUTE $func$
  CREATE OR REPLACE FUNCTION increment(row_id UUID)
  RETURNS INT LANGUAGE plpgsql AS $body$
  DECLARE
    current_value INT;
  BEGIN
    -- Get the current value
    SELECT times_used INTO current_value
    FROM lead_results
    WHERE id = row_id;

    -- Return incremented value
    RETURN COALESCE(current_value, 0) + 1;
  END;
  $body$;
  $func$;
  RAISE NOTICE 'Created or replaced increment function';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating function: %', SQLERRM;
END $$;

-- 5. Verify lead_submissions columns
SELECT
  'lead_submissions' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND column_name LIKE '%contacts%'
ORDER BY ordinal_position;

-- 6. Verify lead_results columns
SELECT
  'lead_results' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_results'
  AND (column_name = 'sent_to_customer' OR column_name = 'sent_at' OR column_name = 'times_used')
ORDER BY ordinal_position;

-- 7. Verify indexes
SELECT
  'indexes' as check,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname = 'idx_lead_results_sent';

-- 8. Verify increment function
SELECT
  'increment function' as check,
  proname,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'increment';
