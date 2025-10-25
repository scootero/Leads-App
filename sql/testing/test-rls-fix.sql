-- Quick test to verify RLS policies are working
-- Run this in your Supabase SQL editor

-- Test inserting into customers table
INSERT INTO customers (email, signup_type) VALUES ('test-rls-fix@example.com', 'newsletter');

-- Test inserting into lead_submissions table
INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email = 'test-rls-fix@example.com'),
  'Test RLS Company',
  'manual',
  'test-rls-123'
);

-- Check if the inserts worked
SELECT
  c.email,
  c.signup_type,
  ls.ref_company,
  ls.mode
FROM customers c
LEFT JOIN lead_submissions ls ON c.id = ls.customer_id
WHERE c.email = 'test-rls-fix@example.com';

-- Check processing queue
SELECT
  type,
  status,
  data->>'email' as email
FROM processing_queue
WHERE data->>'email' = 'test-rls-fix@example.com';
