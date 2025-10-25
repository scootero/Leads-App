-- First, let's check if RLS is causing issues
-- Temporarily disable RLS to test
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO customers (email, signup_type) VALUES ('test@example.com', 'leads');

-- Re-enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies with better syntax
DROP POLICY IF EXISTS "Allow public inserts on customers" ON customers;
DROP POLICY IF EXISTS "Allow public inserts on lead_submissions" ON lead_submissions;

-- Create new policies
CREATE POLICY "Enable insert for all users" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON lead_submissions
  FOR INSERT WITH CHECK (true);
