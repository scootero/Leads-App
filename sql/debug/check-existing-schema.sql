-- Check what tables actually exist in your database
-- Run this in your Supabase SQL editor

-- Check all tables in the public schema
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check the structure of newsletter_signups table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'newsletter_signups'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if customers table exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if lead_submissions table exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lead_submissions'
  AND table_schema = 'public'
ORDER BY ordinal_position;
