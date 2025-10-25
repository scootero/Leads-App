-- Test the complete system with unique emails
-- Run this in your Supabase SQL editor

-- Test newsletter welcome with unique email
INSERT INTO customers (email, signup_type) VALUES ('test-newsletter-' || extract(epoch from now()) || '@example.com', 'newsletter');

-- Test lead processing with unique email
INSERT INTO customers (email, signup_type) VALUES ('test-lead-' || extract(epoch from now()) || '@example.com', 'leads');

-- Test lead submission (using the lead customer we just created)
INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email LIKE 'test-lead-%' ORDER BY created_at DESC LIMIT 1),
  'Test Company ' || extract(epoch from now()),
  'manual',
  'test-' || extract(epoch from now())
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
WHERE c.email LIKE 'test-%'
ORDER BY c.created_at DESC;

SELECT 'All tests completed successfully!' as status;
