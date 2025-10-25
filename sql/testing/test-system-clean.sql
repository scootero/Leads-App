-- Clean up test data and run fresh tests
-- Run this in your Supabase SQL editor

-- Clean up existing test data
DELETE FROM lead_submissions WHERE ref_company LIKE 'Test%';
DELETE FROM customers WHERE email LIKE 'test%@example.com';

-- Test newsletter welcome with fresh email
INSERT INTO customers (email, signup_type) VALUES ('test-newsletter@example.com', 'newsletter');

-- Test lead processing with fresh email
INSERT INTO customers (email, signup_type) VALUES ('test-lead@example.com', 'leads');

-- Test lead submission
INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email = 'test-lead@example.com'),
  'Test Company',
  'manual',
  'test-123'
);

-- Check what we just created
SELECT
  c.email,
  c.signup_type,
  c.created_at,
  ls.ref_company,
  ls.mode
FROM customers c
LEFT JOIN lead_submissions ls ON c.id = ls.customer_id
WHERE c.email IN ('test-newsletter@example.com', 'test-lead@example.com')
ORDER BY c.created_at DESC;

SELECT 'Fresh tests completed successfully!' as status;
