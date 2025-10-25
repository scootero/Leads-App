-- Test Edge Functions using pg_net (Supabase's HTTP client)
-- Run this in your Supabase SQL editor

-- Test newsletter welcome function
SELECT
  net.http_post(
    url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/newsletter-welcome',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'customer_id', 'test-id-123',
      'email', 'test-pgnet@example.com',
      'signup_type', 'newsletter'
    )
  ) as newsletter_response;

-- Test lead processor function
SELECT
  net.http_post(
    url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/lead-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'lead_submission_id', 'test-lead-123',
      'customer_id', 'test-customer-123'
    )
  ) as lead_processor_response;
