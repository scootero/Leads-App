-- Enhance company_contacts table with additional fields
-- This script assumes the table already exists and adds any missing columns

-- 1. Check if we need to create the updated_at function
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_company_contacts_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_company_contacts_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    RAISE NOTICE 'Created update_company_contacts_updated_at function';
  ELSE
    RAISE NOTICE 'update_company_contacts_updated_at function already exists';
  END IF;
END $$;

-- 2. Add any missing columns to company_contacts
DO $$
BEGIN
  -- Rename columns for consistency if they exist with different names
  BEGIN
    ALTER TABLE company_contacts RENAME COLUMN name TO contact_name;
    RAISE NOTICE 'Renamed name column to contact_name';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column name does not exist, no need to rename';
  WHEN duplicate_column THEN
    RAISE NOTICE 'Column contact_name already exists';
  END;

  BEGIN
    ALTER TABLE company_contacts RENAME COLUMN email TO contact_email;
    RAISE NOTICE 'Renamed email column to contact_email';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column email does not exist, no need to rename';
  WHEN duplicate_column THEN
    RAISE NOTICE 'Column contact_email already exists';
  END;

  BEGIN
    ALTER TABLE company_contacts RENAME COLUMN role TO contact_role;
    RAISE NOTICE 'Renamed role column to contact_role';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'Column role does not exist, no need to rename';
  WHEN duplicate_column THEN
    RAISE NOTICE 'Column contact_role already exists';
  END;

  -- Add sent_to_customer column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'company_contacts' AND column_name = 'sent_to_customer') THEN
    ALTER TABLE company_contacts ADD COLUMN sent_to_customer BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added sent_to_customer column';
  ELSE
    RAISE NOTICE 'sent_to_customer column already exists';
  END IF;

  -- Add sent_at column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'company_contacts' AND column_name = 'sent_at') THEN
    ALTER TABLE company_contacts ADD COLUMN sent_at TIMESTAMPTZ;
    RAISE NOTICE 'Added sent_at column';
  ELSE
    RAISE NOTICE 'sent_at column already exists';
  END IF;
END $$;

-- 3. Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_contacts_lead_result_id_contact_email_key'
      AND conrelid = 'company_contacts'::regclass
  ) THEN
    BEGIN
      ALTER TABLE company_contacts
      ADD CONSTRAINT company_contacts_lead_result_id_contact_email_key
      UNIQUE (lead_result_id, contact_email);
      RAISE NOTICE 'Added unique constraint on (lead_result_id, contact_email)';
    EXCEPTION WHEN null_value_not_allowed THEN
      RAISE NOTICE 'Cannot add unique constraint due to NULL values in contact_email';
    END;
  ELSE
    RAISE NOTICE 'Unique constraint on (lead_result_id, contact_email) already exists';
  END IF;
END $$;

-- 4. Create missing indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_company_contacts_sent') THEN
    CREATE INDEX idx_company_contacts_sent ON company_contacts(sent_to_customer);
    RAISE NOTICE 'Created idx_company_contacts_sent index';
  ELSE
    RAISE NOTICE 'idx_company_contacts_sent index already exists';
  END IF;
END $$;

-- 5. Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_company_contacts_updated_at'
      AND tgrelid = 'company_contacts'::regclass
  ) THEN
    CREATE TRIGGER update_company_contacts_updated_at
    BEFORE UPDATE ON company_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_company_contacts_updated_at();
    RAISE NOTICE 'Created update_company_contacts_updated_at trigger';
  ELSE
    RAISE NOTICE 'update_company_contacts_updated_at trigger already exists';
  END IF;
END $$;

-- 6. Enable RLS if not already enabled
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'company_contacts'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on company_contacts table';
  ELSE
    RAISE NOTICE 'RLS already enabled on company_contacts table';
  END IF;
END $$;

-- 7. Create RLS policies if they don't exist
DO $$
BEGIN
  -- Service role policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_contacts'
      AND policyname = 'company_contacts_service_all'
  ) THEN
    CREATE POLICY company_contacts_service_all ON company_contacts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created company_contacts_service_all policy';
  ELSE
    RAISE NOTICE 'company_contacts_service_all policy already exists';
  END IF;

  -- Owner read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_contacts'
      AND policyname = 'company_contacts_owner_read'
  ) THEN
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
  ELSE
    RAISE NOTICE 'company_contacts_owner_read policy already exists';
  END IF;
END $$;

-- 8. Verify the enhanced table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'company_contacts'
ORDER BY ordinal_position;

-- 9. Verify constraints
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'company_contacts'::regclass;

-- 10. Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'company_contacts';

-- 11. Verify RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'company_contacts';
