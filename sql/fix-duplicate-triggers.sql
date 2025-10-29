-- Fix duplicate triggers causing multiple queue entries
-- This script removes redundant triggers that were causing duplicate processing

-- 1. First, let's check what triggers exist
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('lead_submissions', 'customers')
ORDER BY event_object_table, trigger_name;

-- 2. Drop the redundant triggers that call edge functions
DROP TRIGGER IF EXISTS trigger_lead_submission_processor_after_insert ON lead_submissions;
DROP TRIGGER IF EXISTS trigger_lead_processor_after_insert ON customers;

-- 3. Drop the unused functions
DROP FUNCTION IF EXISTS trigger_lead_submission_processor();
DROP FUNCTION IF EXISTS trigger_lead_processor();

-- 4. Verify the remaining triggers
SELECT
  trigger_name,
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

-- 6. Keep only these triggers:
-- - trigger_add_lead_submission_to_queue (for lead processing)
-- - trigger_newsletter_welcome_after_insert (for welcome emails)
