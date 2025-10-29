-- Database Trigger Documentation
-- This file documents the database triggers in the system

/*
CURRENT TRIGGERS
===============

1. trigger_newsletter_welcome_after_insert
   - Table: customers
   - Event: INSERT
   - Function: trigger_newsletter_welcome()
   - Purpose: Sends welcome emails when a customer signs up
   - Location: Defined in sql/setup/supabase-schema.sql

2. trigger_add_lead_submission_to_queue
   - Table: lead_submissions
   - Event: INSERT
   - Function: add_lead_submission_to_queue()
   - Purpose: Adds lead submissions to the processing queue for automated processing
   - Location: Defined in sql/setup/queue-improvements-final.sql

TRIGGER WORKFLOW
===============

When a user submits a lead form:
1. A new customer record is created (or existing one found)
2. A new lead_submission record is created
3. The trigger_add_lead_submission_to_queue fires and adds a lead_generation job to the queue
4. The trigger_newsletter_welcome_after_insert fires and sends a welcome email

When the cron job runs:
1. It processes the lead_generation job
2. After processing, it adds a lead_results_email job to the queue
3. It then processes any lead_results_email jobs

This ensures each submission creates exactly:
- One lead_generation job
- One lead_results_email job (after processing)
- One welcome email notification
*/

-- View trigger definitions
SELECT
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('lead_submissions', 'customers')
ORDER BY event_object_table, trigger_name;

-- View trigger functions
SELECT
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname IN ('add_lead_submission_to_queue', 'trigger_newsletter_welcome');

-- Check processing_queue entries
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
