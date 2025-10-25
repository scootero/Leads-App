-- Manual test to add a fresh email to the queue
-- Run this in your Supabase SQL editor

-- Add a test item directly to the processing queue
INSERT INTO processing_queue (type, data, status)
VALUES (
  'newsletter_welcome',
  '{"email": "test-fresh-email@example.com", "customer_id": "test-customer-123", "signup_type": "pdf"}',
  'pending'
);

-- Check that it was added
SELECT
  id,
  type,
  status,
  data->>'email' as email,
  created_at
FROM processing_queue
WHERE data->>'email' = 'test-fresh-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
