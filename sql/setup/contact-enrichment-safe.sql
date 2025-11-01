-- Contact Enrichment Schema Updates (Safe Version)
-- Run this in your Supabase SQL editor
-- This version uses DO blocks to handle errors more gracefully

-- 1. Add contact enrichment status fields to lead_submissions
DO $$
BEGIN
  BEGIN
    ALTER TABLE lead_submissions
      ADD COLUMN contacts_enriched BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added contacts_enriched column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column contacts_enriched already exists';
  END;

  BEGIN
    ALTER TABLE lead_submissions
      ADD COLUMN contacts_enriched_at TIMESTAMPTZ;
    RAISE NOTICE 'Added contacts_enriched_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column contacts_enriched_at already exists';
  END;

  BEGIN
    ALTER TABLE lead_submissions
      ADD COLUMN contacts_enrichment_error TEXT;
    RAISE NOTICE 'Added contacts_enrichment_error column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column contacts_enrichment_error already exists';
  END;
END $$;

-- 2. Create company_contacts table for multiple contacts per company
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_contacts') THEN
    CREATE TABLE company_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_result_id UUID NOT NULL REFERENCES lead_results(id) ON DELETE CASCADE,
      contact_name TEXT NOT NULL,
      contact_email TEXT,
      contact_role TEXT,
      is_primary BOOLEAN DEFAULT FALSE,
      sent_to_customer BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (lead_result_id, contact_email)
    );

    -- Create indexes immediately after table creation
    CREATE INDEX idx_company_contacts_result ON company_contacts(lead_result_id);
    CREATE INDEX idx_company_contacts_sent ON company_contacts(sent_to_customer);

    RAISE NOTICE 'Created company_contacts table and indexes';
  ELSE
    RAISE NOTICE 'company_contacts table already exists';

    -- Ensure indexes exist even if table already existed
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_company_contacts_result') THEN
      CREATE INDEX idx_company_contacts_result ON company_contacts(lead_result_id);
      RAISE NOTICE 'Created idx_company_contacts_result index';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_company_contacts_sent') THEN
      CREATE INDEX idx_company_contacts_sent ON company_contacts(sent_to_customer);
      RAISE NOTICE 'Created idx_company_contacts_sent index';
    END IF;
  END IF;
END $$;

-- 3. Add tracking fields to lead_results
DO $$
BEGIN
  BEGIN
    ALTER TABLE lead_results
      ADD COLUMN sent_to_customer BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added sent_to_customer column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column sent_to_customer already exists';
  END;

  BEGIN
    ALTER TABLE lead_results
      ADD COLUMN sent_at TIMESTAMPTZ;
    RAISE NOTICE 'Added sent_at column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column sent_at already exists';
  END;

  BEGIN
    ALTER TABLE lead_results
      ADD COLUMN times_used INT DEFAULT 0;
    RAISE NOTICE 'Added times_used column';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column times_used already exists';
  END;
END $$;

-- 4. Create lead_results index
-- (Company contacts indexes are now created with the table)

-- 5. Create index on lead_results after adding the column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lead_results_sent') THEN
    CREATE INDEX idx_lead_results_sent ON lead_results(sent_to_customer);
    RAISE NOTICE 'Created idx_lead_results_sent index';
  ELSE
    RAISE NOTICE 'idx_lead_results_sent index already exists';
  END IF;
END $$;

-- 6. Enable RLS on company_contacts
DO $$
BEGIN
  EXECUTE 'ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY';
  RAISE NOTICE 'Enabled RLS on company_contacts table';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error enabling RLS: %', SQLERRM;
END $$;

-- 7. Create RLS policies for company_contacts
DO $$
BEGIN
  -- Drop policies if they exist
  BEGIN
    DROP POLICY IF EXISTS company_contacts_service_all ON company_contacts;
    RAISE NOTICE 'Dropped company_contacts_service_all policy';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy: %', SQLERRM;
  END;

  BEGIN
    DROP POLICY IF EXISTS company_contacts_owner_read ON company_contacts;
    RAISE NOTICE 'Dropped company_contacts_owner_read policy';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy: %', SQLERRM;
  END;

  -- Create new policies
  BEGIN
    CREATE POLICY company_contacts_service_all ON company_contacts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created company_contacts_service_all policy';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
  END;

  BEGIN
    CREATE POLICY company_contacts_owner_read ON company_contacts
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM lead_results r
        JOIN lead_submissions s ON r.lead_submission_id = s.id
        JOIN customers c ON s.customer_id = c.id
        WHERE r.id = company_contacts.lead_result_id
          AND c.email = auth.email()
      )
    );
    RAISE NOTICE 'Created company_contacts_owner_read policy';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
  END;
END $$;

-- 8. Create increment function
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

-- 9. Verify the changes
SELECT
  'lead_submissions' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND column_name LIKE '%contacts%'
ORDER BY ordinal_position;

SELECT
  'company_contacts' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'company_contacts'
ORDER BY ordinal_position;

SELECT
  'lead_results' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'lead_results'
  AND (column_name = 'sent_to_customer' OR column_name = 'sent_at' OR column_name = 'times_used')
ORDER BY ordinal_position;

-- 10. Check RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'company_contacts';

-- 11. Check function
SELECT pg_get_functiondef('increment(uuid)'::regprocedure);
