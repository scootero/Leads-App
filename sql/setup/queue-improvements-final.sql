-- Fix processing_queue missing priority column
-- Run this in your Supabase SQL editor

-- 1. First, let's see what constraints currently exist
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'processing_queue'::regclass;

-- 2. Let's see what status values currently exist
SELECT DISTINCT status, COUNT(*) as count
FROM processing_queue
GROUP BY status;

-- 3. Let's see the current table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'processing_queue'
ORDER BY ordinal_position;

-- 4. Drop the existing constraint completely
ALTER TABLE processing_queue
DROP CONSTRAINT IF EXISTS processing_queue_status_check;

-- 5. Add missing priority column
ALTER TABLE processing_queue
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;

-- 6. Now add the retry logic fields (if they don't exist)
ALTER TABLE processing_queue
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS run_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- 7. Update existing rows to use new status values
UPDATE processing_queue
SET status = CASE
  WHEN status = 'pending' THEN 'queued'
  WHEN status = 'completed' THEN 'succeeded'
  WHEN status = 'processing' THEN 'processing'
  WHEN status = 'failed' THEN 'failed'
  ELSE 'queued'  -- default for any other values
END;

-- 8. Update existing rows to have proper run_at values
UPDATE processing_queue
SET run_at = COALESCE(processed_at, created_at, NOW())
WHERE run_at IS NULL;

-- 9. Now add the new constraint
ALTER TABLE processing_queue
ADD CONSTRAINT processing_queue_status_check
CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'dead'));

-- 10. Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_queue_status_runat ON processing_queue(status, run_at);
CREATE INDEX IF NOT EXISTS idx_queue_type_status ON processing_queue(type, status);

-- 11. Safe claim function with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION claim_queue(p_type TEXT, p_limit INT)
RETURNS SETOF processing_queue
LANGUAGE SQL AS $$
  WITH cte AS (
    SELECT id
    FROM processing_queue
    WHERE type = p_type
      AND status = 'queued'
      AND run_at <= NOW()
    ORDER BY priority DESC, run_at ASC, id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE processing_queue q
     SET status = 'processing'
  FROM cte
  WHERE q.id = cte.id
  RETURNING q.*;
$$;

-- 12. Retry with exponential backoff function
CREATE OR REPLACE FUNCTION bump_attempt(p_id BIGINT, p_next_run_at TIMESTAMPTZ, p_error TEXT)
RETURNS VOID LANGUAGE PLPGSQL AS $$
DECLARE
  v_attempts INT;
  v_max INT;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max
  FROM processing_queue WHERE id = p_id FOR UPDATE;

  v_attempts := v_attempts + 1;

  IF v_attempts >= v_max THEN
    -- Move to dead letter queue
    UPDATE processing_queue
       SET status = 'dead', attempts = v_attempts, last_error = p_error
     WHERE id = p_id;
  ELSE
    -- Retry with backoff
    UPDATE processing_queue
       SET status = 'queued', attempts = v_attempts, run_at = p_next_run_at, last_error = p_error
     WHERE id = p_id;
  END IF;
END;
$$;

-- 13. Update the trigger to use new queue structure
CREATE OR REPLACE FUNCTION add_lead_submission_to_queue()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO processing_queue(type, data, priority, status, run_at)
  VALUES (
    'lead_generation',
    jsonb_build_object('lead_submission_id', NEW.id),
    2,
    'queued',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Recreate the trigger
DROP TRIGGER IF EXISTS trigger_add_lead_submission_to_queue ON lead_submissions;
CREATE TRIGGER trigger_add_lead_submission_to_queue
  AFTER INSERT ON lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION add_lead_submission_to_queue();

-- 15. Verify the changes
SELECT
  id,
  type,
  status,
  priority,
  attempts,
  run_at,
  created_at
FROM processing_queue
ORDER BY created_at DESC
LIMIT 5;

-- 16. Test the claim function
SELECT 'Testing claim_queue function...' as test_message;
SELECT * FROM claim_queue('lead_generation', 1);
