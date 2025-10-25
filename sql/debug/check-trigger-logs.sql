-- Check if Edge Functions are being called
-- Run this in your Supabase SQL editor to see database logs

-- Check recent database logs for trigger warnings
SELECT
  log_time,
  log_level,
  log_message
FROM pg_stat_statements
WHERE query LIKE '%trigger%'
ORDER BY log_time DESC
LIMIT 10;

-- Alternative: Check if there are any recent warnings
-- (This might not work in all Supabase setups)
SELECT
  'Check Supabase Dashboard -> Logs for trigger warnings' as instruction;

-- Test the HTTP extension
SELECT
  'HTTP extension status: ' ||
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http')
    THEN 'INSTALLED'
    ELSE 'NOT INSTALLED'
  END as http_status;
