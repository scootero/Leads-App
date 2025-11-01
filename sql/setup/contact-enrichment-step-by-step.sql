-- Contact Enrichment Schema Updates (Step by Step)
-- Run this in your Supabase SQL editor
-- This version executes each operation individually to avoid dependency issues

-- Step 1: Add contact enrichment status fields to lead_submissions
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS contacts_enriched BOOLEAN DEFAULT FALSE;
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS contacts_enriched_at TIMESTAMPTZ;
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS contacts_enrichment_error TEXT;

-- Step 2: Add tracking fields to lead_results
ALTER TABLE lead_results ADD COLUMN IF NOT EXISTS sent_to_customer BOOLEAN DEFAULT FALSE;
ALTER TABLE lead_results ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE lead_results ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0;

-- Step 3: Create lead_results index
CREATE INDEX IF NOT EXISTS idx_lead_results_sent ON lead_results(sent_to_customer);

-- Step 4: Create company_contacts table
CREATE TABLE IF NOT EXISTS company_contacts (
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

-- Step 5: Create company_contacts indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_result ON company_contacts(lead_result_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_sent ON company_contacts(sent_to_customer);

-- Step 6: Enable RLS on company_contacts
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for company_contacts
DROP POLICY IF EXISTS company_contacts_service_all ON company_contacts;
CREATE POLICY company_contacts_service_all ON company_contacts
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS company_contacts_owner_read ON company_contacts;
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

-- Step 8: Create increment function
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

-- Step 9: Verify the changes
SELECT 'lead_submissions columns' AS check, COUNT(*) AS count
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND column_name IN ('contacts_enriched', 'contacts_enriched_at', 'contacts_enrichment_error');

SELECT 'lead_results columns' AS check, COUNT(*) AS count
FROM information_schema.columns
WHERE table_name = 'lead_results'
  AND column_name IN ('sent_to_customer', 'sent_at', 'times_used');

SELECT 'company_contacts table' AS check,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_contacts') AS exists;

SELECT 'indexes' AS check, indexname
FROM pg_indexes
WHERE indexname IN (
  'idx_lead_results_sent',
  'idx_company_contacts_result',
  'idx_company_contacts_sent'
);

SELECT 'rls policies' AS check, policyname
FROM pg_policies
WHERE tablename = 'company_contacts';

SELECT 'increment function' AS check,
  EXISTS (SELECT FROM pg_proc WHERE proname = 'increment') AS exists;
