-- Safe approach: Create lead_submissions table first
-- Run this in your Supabase SQL editor

-- STEP 1: Create the lead_submissions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS lead_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  ref_company TEXT NOT NULL,
  industry TEXT,
  region TEXT,
  keywords TEXT,
  mode TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Verify the table was created correctly
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_submissions_customer_id ON lead_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_submitted_at ON lead_submissions(submitted_at);

-- STEP 4: Enable RLS
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create policy
CREATE POLICY "Allow public inserts on lead_submissions" ON lead_submissions
  FOR INSERT WITH CHECK (true);

-- STEP 6: Test the table by inserting a test record
-- First, let's get a customer ID to reference
SELECT id FROM customers LIMIT 1;

-- If you have a customer, you can test with:
-- INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
-- VALUES ((SELECT id FROM customers LIMIT 1), 'Test Company', 'manual', 'test-123');
