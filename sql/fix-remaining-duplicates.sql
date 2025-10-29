-- Fix remaining duplicate triggers
-- This script removes the additional duplicate triggers found

-- 1. Check what functions these triggers use
SELECT
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname IN ('add_to_processing_queue', 'add_lead_submission_to_queue');

-- 2. Drop the duplicate triggers
DROP TRIGGER IF EXISTS add_customer_to_queue_after_insert ON customers;
DROP TRIGGER IF EXISTS trigger_add_to_processing_queue ON customers;
DROP TRIGGER IF EXISTS add_lead_submission_to_queue_after_insert ON lead_submissions;

-- 3. Keep only these essential triggers:
-- - trigger_add_lead_submission_to_queue (for lead processing)
-- - trigger_newsletter_welcome_after_insert (for welcome emails)

-- 4. Verify the remaining triggers
SELECT
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('lead_submissions', 'customers')
ORDER BY event_object_table, trigger_name;

-- 5. Check the processing_queue to see what's there
SELECT
  id,
  type,
  status,
  data,
  created_at,
  run_at
FROM processing_queue
ORDER BY created_at DESC
LIMIT 10;
