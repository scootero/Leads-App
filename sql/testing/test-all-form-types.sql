-- Test all three form types
-- Run this in your Supabase SQL editor to verify the system works

-- Test 1: Newsletter signup
INSERT INTO customers (email, signup_type) VALUES ('test-newsletter@example.com', 'newsletter');

-- Test 2: PDF request
INSERT INTO customers (email, signup_type) VALUES ('test-pdf@example.com', 'pdf');

-- Test 3: Lead submission
INSERT INTO customers (email, signup_type) VALUES ('test-lead@example.com', 'leads');

-- Test 4: Lead submission with lead_submissions record
INSERT INTO lead_submissions (customer_id, ref_company, industry, region, keywords, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email = 'test-lead@example.com' LIMIT 1),
  'Test Company Inc',
  'Technology',
  'North America',
  'AI, automation, software',
  'manual',
  'test-lead-123'
);

-- Check all customers
SELECT
  email,
  signup_type,
  created_at
FROM customers
WHERE email LIKE 'test-%'
ORDER BY created_at DESC;

-- Check lead submissions
SELECT
  ls.ref_company,
  ls.industry,
  ls.region,
  ls.keywords,
  ls.mode,
  ls.mode_id,
  c.email
FROM lead_submissions ls
JOIN customers c ON ls.customer_id = c.id
WHERE c.email LIKE 'test-%'
ORDER BY ls.created_at DESC;

-- Check processing queue
SELECT
  type,
  status,
  created_at,
  processed_at
FROM processing_queue
WHERE data->>'email' LIKE 'test-%'
ORDER BY created_at DESC;
