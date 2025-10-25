-- Test newsletter_signups table
-- Run this in Supabase SQL Editor to debug

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'newsletter_signups'
ORDER BY ordinal_position;

-- Test insert
INSERT INTO newsletter_signups (email, signup_type) VALUES
  ('newsletter-test@example.com', 'newsletter');

-- Test PDF insert
INSERT INTO newsletter_signups (email, signup_type) VALUES
  ('pdf-test@example.com', 'pdf');

-- Check if inserts worked
SELECT * FROM newsletter_signups WHERE email LIKE '%test@example.com';

-- Clean up
DELETE FROM newsletter_signups WHERE email LIKE '%test@example.com';
