-- Drop the triggers that are causing errors
DROP TRIGGER IF EXISTS trigger_newsletter_welcome_after_insert ON customers;
DROP TRIGGER IF EXISTS trigger_lead_processor_after_insert ON customers;

-- Verify triggers are gone
SELECT trigger_name, event_object_table, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'customers'
  AND trigger_schema = 'public';
