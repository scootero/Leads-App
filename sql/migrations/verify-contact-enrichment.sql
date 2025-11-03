-- Verify and Fix Contact Enrichment Setup
-- Run this in your Supabase SQL editor to ensure all tables, columns, and functions exist

-- 1. Check if company_contacts table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_contacts') THEN
    RAISE NOTICE 'Creating company_contacts table...';

    -- Create company_contacts table
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

    -- Create indexes
    CREATE INDEX idx_company_contacts_result ON company_contacts(lead_result_id);
    CREATE INDEX idx_company_contacts_sent ON company_contacts(sent_to_customer);

    -- Enable RLS
    ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY company_contacts_service_all ON company_contacts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

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

    RAISE NOTICE 'company_contacts table created successfully';
  ELSE
    RAISE NOTICE 'company_contacts table already exists';
  END IF;
END $$;

-- 2. Check and add columns to lead_submissions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_submissions' AND column_name = 'contacts_enriched') THEN
    RAISE NOTICE 'Adding contact enrichment columns to lead_submissions...';

    ALTER TABLE lead_submissions
      ADD COLUMN contacts_enriched BOOLEAN DEFAULT FALSE,
      ADD COLUMN contacts_enriched_at TIMESTAMPTZ,
      ADD COLUMN contacts_enrichment_error TEXT;

    RAISE NOTICE 'Contact enrichment columns added to lead_submissions';
  ELSE
    RAISE NOTICE 'Contact enrichment columns already exist in lead_submissions';
  END IF;
END $$;

-- 3. Check and add columns to lead_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'lead_results' AND column_name = 'sent_to_customer') THEN
    RAISE NOTICE 'Adding tracking columns to lead_results...';

    ALTER TABLE lead_results
      ADD COLUMN sent_to_customer BOOLEAN DEFAULT FALSE,
      ADD COLUMN sent_at TIMESTAMPTZ,
      ADD COLUMN times_used INT DEFAULT 0;

    CREATE INDEX idx_lead_results_sent ON lead_results(sent_to_customer);

    RAISE NOTICE 'Tracking columns added to lead_results';
  ELSE
    RAISE NOTICE 'Tracking columns already exist in lead_results';
  END IF;
END $$;

-- 4. Create or replace increment function
CREATE OR REPLACE FUNCTION increment(row_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
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
$$;

RAISE NOTICE 'increment function created or replaced';

-- 5. Verify all required tables and columns exist
SELECT
  'Tables verification' as check_type,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_contacts') as company_contacts_exists,
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lead_submissions' AND column_name = 'contacts_enriched') as lead_submissions_columns_exist,
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lead_results' AND column_name = 'sent_to_customer') as lead_results_columns_exist;

-- 6. Verify RLS policies
SELECT
  'RLS policies verification' as check_type,
  EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'company_contacts' AND policyname = 'company_contacts_service_all'
  ) as service_policy_exists,
  EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'company_contacts' AND policyname = 'company_contacts_owner_read'
  ) as owner_read_policy_exists;

-- 7. Test increment function
SELECT
  'Function test' as check_type,
  (SELECT pg_get_functiondef('increment(uuid)'::regprocedure)) IS NOT NULL as increment_function_exists;

-- 8. Check for existing contact enrichment jobs in queue
SELECT
  'Queue status' as check_type,
  COUNT(*) as contact_enrichment_jobs_count,
  COUNT(*) FILTER (WHERE status = 'queued') as queued_jobs,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
  COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded_jobs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs
FROM processing_queue
WHERE type = 'contact_enrichment';

-- 9. Show sample of existing contacts if any
SELECT
  'Existing contacts' as check_type,
  COUNT(*) as total_contacts,
  COUNT(DISTINCT lead_result_id) as companies_with_contacts
FROM company_contacts;

-- 10. Show top 5 contacts if any exist
SELECT 'Sample contacts' as title, *
FROM company_contacts
LIMIT 5;
