-- Test with a completely new email address
-- Run this in your Supabase SQL editor

-- First, let's see what emails are already in the customers table
SELECT
  email,
  signup_type,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- Now let's test with a brand new email
-- Use a unique email like: test-2025-01-23@example.com
