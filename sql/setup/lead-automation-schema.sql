-- Lead Automation Schema Updates
-- Run this in your Supabase SQL editor

-- 1. Add processing status enum
DO $$ BEGIN
  CREATE TYPE lead_proc_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add processing status fields to lead_submissions
ALTER TABLE lead_submissions
  ADD COLUMN IF NOT EXISTS processing_status lead_proc_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS results_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS results_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS results_sent_at TIMESTAMPTZ;

-- 3. Create lead_results table with rank and uniqueness
CREATE TABLE IF NOT EXISTS lead_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_submission_id UUID NOT NULL REFERENCES lead_submissions(id) ON DELETE CASCADE,
  rank INT NOT NULL, -- 1..N
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  why_chosen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lead_submission_id, rank),
  UNIQUE (lead_submission_id, company_name)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_submissions_status ON lead_submissions(processing_status);
CREATE INDEX IF NOT EXISTS idx_lead_results_submission ON lead_results(lead_submission_id);

-- 5. Enable RLS on lead_results
ALTER TABLE lead_results ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for lead_results
-- Service role full access
DROP POLICY IF EXISTS lead_results_service_all ON lead_results;
CREATE POLICY lead_results_service_all ON lead_results
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Read for authenticated users (if they own the submission)
DROP POLICY IF EXISTS lead_results_owner_read ON lead_results;
CREATE POLICY lead_results_owner_read ON lead_results
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM lead_submissions s
    JOIN customers c ON s.customer_id = c.id
    WHERE s.id = lead_results.lead_submission_id
      AND c.email = auth.email()
  )
);

-- 7. Verify the changes
SELECT
  'lead_submissions' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND column_name LIKE '%processing%' OR column_name LIKE '%results%'
ORDER BY ordinal_position;

SELECT
  'lead_results' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lead_results'
ORDER BY ordinal_position;
