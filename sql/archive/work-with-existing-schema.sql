-- Work with existing newsletter_signups table
-- Run this in your Supabase SQL editor

-- First, let's see what columns exist in newsletter_signups
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'newsletter_signups'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create customers table (if it doesn't exist) based on newsletter_signups
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  signup_type TEXT NOT NULL CHECK (signup_type IN ('leads', 'newsletter', 'pdf')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_submissions table
CREATE TABLE IF NOT EXISTS lead_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  ref_company TEXT NOT NULL,
  industry TEXT,
  region TEXT,
  keywords TEXT,
  mode TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_signup_type ON customers(signup_type);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_customer_id ON lead_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_submitted_at ON lead_submissions(submitted_at);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public inserts on customers" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public inserts on lead_submissions" ON lead_submissions
  FOR INSERT WITH CHECK (true);

-- Create updated_at function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Test the setup
SELECT 'Tables created successfully!' as status;

-- Test insert
INSERT INTO customers (email, signup_type) VALUES ('test@example.com', 'newsletter');

-- Test lead_submissions insert
INSERT INTO lead_submissions (customer_id, ref_company, mode, mode_id)
VALUES (
  (SELECT id FROM customers WHERE email = 'test@example.com' LIMIT 1),
  'Test Company',
  'manual',
  'test-123'
);

SELECT 'Test inserts completed!' as status;
