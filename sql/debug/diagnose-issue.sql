-- Diagnostic script to check what's wrong
-- Run this in your Supabase SQL editor to see the current state

-- Check if lead_submissions table exists and its structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if customers table structure is correct
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if any triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Check if any functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%trigger%'
ORDER BY routine_name;
