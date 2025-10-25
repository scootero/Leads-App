-- Manual test of the queue-processor Edge Function
-- Run this in your Supabase SQL editor to test email sending

-- First, let's add a test item to the queue
INSERT INTO processing_queue (type, data, status)
VALUES (
  'newsletter_welcome',
  '{"email": "oliverscott14@gmail.com", "customer_id": "test-123", "signup_type": "newsletter"}',
  'pending'
);

-- Check that it was added
SELECT
  id,
  type,
  status,
  data->>'email' as email
FROM processing_queue
WHERE data->>'email' = 'oliverscott14@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Now manually call the Edge Function
-- Replace YOUR_PROJECT_URL with your actual Supabase project URL
-- Replace YOUR_SERVICE_ROLE_KEY with your actual service role key

-- Example: https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/queue-processor
