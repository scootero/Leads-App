-- Check current database state
-- Run this first to see what tables and functions already exist

-- Check if tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'lead_submissions')
ORDER BY table_name;

-- Check if functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%trigger%'
ORDER BY routine_name;

-- Check if triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Check if extensions exist
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'http';
