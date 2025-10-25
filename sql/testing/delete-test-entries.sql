-- Delete test entries to allow re-testing with your email
-- Run this in your Supabase SQL editor

-- First, let's see what's in the customers table
SELECT
  email,
  signup_type,
  created_at
FROM customers
ORDER BY created_at DESC;

-- Delete your test email entries
DELETE FROM customers
WHERE email = 'oliverscott14@gmail.com';

-- Also delete any related queue items
DELETE FROM processing_queue
WHERE data->>'email' = 'oliverscott14@gmail.com';

-- Check that they're gone
SELECT
  email,
  signup_type,
  created_at
FROM customers
WHERE email = 'oliverscott14@gmail.com';

-- Check queue is clean
SELECT
  id,
  type,
  status,
  data->>'email' as email
FROM processing_queue
WHERE data->>'email' = 'oliverscott14@gmail.com';
