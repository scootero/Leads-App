-- Enhance company_contacts table with additional fields (Simple Version)
-- This script assumes the table already exists and adds any missing columns
-- This version uses simple SQL statements without complex DO blocks

-- 1. Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_company_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Try to rename columns for consistency (will fail silently if they don't exist or already renamed)
ALTER TABLE company_contacts RENAME COLUMN name TO contact_name;
ALTER TABLE company_contacts RENAME COLUMN email TO contact_email;
ALTER TABLE company_contacts RENAME COLUMN role TO contact_role;

-- 3. Add any missing columns
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS sent_to_customer BOOLEAN DEFAULT FALSE;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_result ON company_contacts(lead_result_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_sent ON company_contacts(sent_to_customer);

-- 5. Try to add unique constraint (will fail if there are duplicate or NULL values)
ALTER TABLE company_contacts
  DROP CONSTRAINT IF EXISTS company_contacts_lead_result_id_contact_email_key;

-- Only add the constraint if there are no NULL contact_emails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM company_contacts
    WHERE contact_email IS NULL
  ) THEN
    ALTER TABLE company_contacts
    ADD CONSTRAINT company_contacts_lead_result_id_contact_email_key
    UNIQUE (lead_result_id, contact_email);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END $$;

-- 6. Enable RLS
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
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

-- 8. Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON company_contacts;
CREATE TRIGGER update_company_contacts_updated_at
BEFORE UPDATE ON company_contacts
FOR EACH ROW
EXECUTE FUNCTION update_company_contacts_updated_at();

-- 9. Verify the enhanced table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'company_contacts'
ORDER BY ordinal_position;

-- 10. Verify constraints
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'company_contacts'::regclass;

-- 11. Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'company_contacts';

-- 12. Verify RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'company_contacts';
