-- Contact Enrichment Schema Updates
-- Run this in your Supabase SQL editor

-- 1. Add contact enrichment status fields to lead_submissions
ALTER TABLE lead_submissions
  ADD COLUMN IF NOT EXISTS contacts_enriched BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contacts_enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contacts_enrichment_error TEXT;

-- 2. Create company_contacts table for multiple contacts per company
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

-- 3. Add tracking fields to lead_results
ALTER TABLE lead_results
  ADD COLUMN IF NOT EXISTS sent_to_customer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_contacts_result ON company_contacts(lead_result_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_sent ON company_contacts(sent_to_customer);

-- 5. Create index on lead_results after adding the column
CREATE INDEX IF NOT EXISTS idx_lead_results_sent ON lead_results(sent_to_customer);

-- 6. Enable RLS on company_contacts
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for company_contacts
-- Service role full access
DROP POLICY IF EXISTS company_contacts_service_all ON company_contacts;
CREATE POLICY company_contacts_service_all ON company_contacts
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Read for authenticated users (if they own the submission)
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

-- 8. Verify the changes
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
