-- Test Contact Enrichment Feature
-- Run this in your Supabase SQL editor to test the contact enrichment feature

-- 1. Create a test lead submission
INSERT INTO customers (email, signup_type)
VALUES ('test@example.com', 'leads')
RETURNING id AS customer_id \gset

INSERT INTO lead_submissions (
  customer_id,
  ref_company,
  industry,
  region,
  keywords,
  mode,
  mode_id
)
VALUES (
  :'customer_id',
  'Microsoft',
  'Technology',
  'United States',
  'software, cloud, enterprise',
  'General company leads',
  'leads'
)
RETURNING id AS lead_id \gset

-- 2. Insert test companies (this would normally be done by the lead generation process)
INSERT INTO lead_results (
  lead_submission_id,
  rank,
  company_name,
  website,
  industry,
  company_size,
  location,
  why_chosen
)
VALUES
  (:'lead_id', 1, 'Google', 'https://google.com', 'Technology', 'enterprise', 'United States', 'Major tech company'),
  (:'lead_id', 2, 'Apple', 'https://apple.com', 'Technology', 'enterprise', 'United States', 'Major tech company'),
  (:'lead_id', 3, 'Amazon', 'https://amazon.com', 'Technology', 'enterprise', 'United States', 'Major tech company')
RETURNING id, company_name;

-- 3. Create a contact enrichment job
INSERT INTO processing_queue (
  type,
  data,
  priority,
  status,
  run_at
)
VALUES (
  'contact_enrichment',
  jsonb_build_object('lead_submission_id', :'lead_id'),
  2,
  'queued',
  NOW()
)
RETURNING id AS job_id;

-- 4. Show what we've created
SELECT 'Test setup complete. Created:' AS message;
SELECT 'Customer' AS entity, id, email FROM customers WHERE id = :'customer_id';
SELECT 'Lead submission' AS entity, id, ref_company FROM lead_submissions WHERE id = :'lead_id';
SELECT 'Companies' AS entity, id, company_name, website FROM lead_results WHERE lead_submission_id = :'lead_id';
SELECT 'Queue job' AS entity, id, type, status FROM processing_queue WHERE data->>'lead_submission_id' = :'lead_id';

-- 5. Instructions for testing
SELECT '
NEXT STEPS:

1. Run the queue processing endpoint:
   - Go to your app and trigger the queue processing endpoint
   - Or wait for the cron job to run

2. Check the results:
   - Run this query to see if contacts were found:
     SELECT lr.company_name, cc.contact_name, cc.contact_email, cc.contact_role
     FROM company_contacts cc
     JOIN lead_results lr ON cc.lead_result_id = lr.id
     WHERE lr.lead_submission_id = ''' || :'lead_id' || ''';

3. Check if the email job was created:
   SELECT * FROM processing_queue
   WHERE type = ''lead_results_email''
   AND data->>''lead_submission_id'' = ''' || :'lead_id' || ''';

4. Clean up (optional):
   DELETE FROM lead_submissions WHERE id = ''' || :'lead_id' || ''';
   DELETE FROM customers WHERE id = ''' || :'customer_id' || ''';
' AS testing_instructions;
