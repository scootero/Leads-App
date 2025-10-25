-- Simple debug script to check email issues
-- Run this in your Supabase SQL editor

-- Check recent queue items and their status
SELECT
  id,
  type,
  status,
  created_at,
  processed_at,
  error_message,
  data->>'email' as email
FROM processing_queue
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any failed items
SELECT
  id,
  type,
  status,
  error_message,
  data->>'email' as email
FROM processing_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any pending items
SELECT
  id,
  type,
  status,
  created_at,
  data->>'email' as email
FROM processing_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;
