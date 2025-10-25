-- Quick test to verify table structure and data
-- Run this in Supabase SQL Editor to check if everything is working

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('newsletter_signups', 'lead_submissions', 'lead_results');

-- Check lead_submissions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
ORDER BY ordinal_position;

-- Try a simple insert test
INSERT INTO lead_submissions (
  email,
  ref_company,
  mode,
  mode_id,
  processing_status
) VALUES (
  'test@example.com',
  'Test Company',
  'General company leads',
  'leads',
  'pending'
);

-- Check if the insert worked
SELECT * FROM lead_submissions WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM lead_submissions WHERE email = 'test@example.com';
