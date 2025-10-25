-- Manual test of Edge Functions
-- Run this in your Supabase SQL editor

-- Test if we can make HTTP calls to Edge Functions
SELECT
  http_post(
    url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/newsletter-welcome',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'customer_id', 'test-id',
      'email', 'test@example.com',
      'signup_type', 'newsletter'
    )
  ) as newsletter_response;

-- Test lead processor function
SELECT
  http_post(
    url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/lead-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'lead_submission_id', 'test-lead-id',
      'customer_id', 'test-customer-id'
    )
  ) as lead_processor_response;
