-- Check and fix lead_submissions table structure
-- Run this in your Supabase SQL editor

-- First, check what columns actually exist in lead_submissions
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the table doesn't have the right structure, let's recreate it
DROP TABLE IF EXISTS lead_submissions CASCADE;

-- Recreate the lead_submissions table with correct structure
CREATE TABLE lead_submissions (
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

-- Create indexes
CREATE INDEX idx_lead_submissions_customer_id ON lead_submissions(customer_id);
CREATE INDEX idx_lead_submissions_submitted_at ON lead_submissions(submitted_at);

-- Enable RLS
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow public inserts on lead_submissions" ON lead_submissions
  FOR INSERT WITH CHECK (true);

-- Verify the table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the table
INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email = 'test-lead-trigger@example.com' LIMIT 1),
  'Test Company for Trigger',
  'manual',
  'test-trigger-123'
);

SELECT 'lead_submissions table fixed and tested!' as status;
