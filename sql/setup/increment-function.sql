-- Create a function to increment a counter field
-- This is used to increment the times_used field in lead_results

-- Create the increment function
CREATE OR REPLACE FUNCTION increment(row_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  current_value INT;
BEGIN
  -- Get the current value
  SELECT times_used INTO current_value
  FROM lead_results
  WHERE id = row_id;

  -- Return incremented value
  RETURN COALESCE(current_value, 0) + 1;
END;
$$;

-- Test the function
SELECT 'Testing increment function...' as test_message;
SELECT increment('00000000-0000-0000-0000-000000000000'::UUID);
