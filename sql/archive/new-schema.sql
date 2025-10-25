-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS lead_submissions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create newsletter_signups table (for all email-only signups)
CREATE TABLE newsletter_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  signup_type TEXT NOT NULL CHECK (signup_type IN ('newsletter', 'pdf')),
  source TEXT DEFAULT 'website', -- track where they signed up from
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Edge function processing status
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
  pdf_sent BOOLEAN DEFAULT FALSE,
  pdf_sent_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT
);

-- Create lead_submissions table (for lead generation forms)
CREATE TABLE lead_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ref_company TEXT NOT NULL,
  industry TEXT,
  region TEXT,
  keywords TEXT,
  mode TEXT NOT NULL, -- 'General company leads', etc.
  mode_id TEXT NOT NULL, -- 'leads', 'buyers', 'suppliers'
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Edge function processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  -- Results tracking
  results_generated BOOLEAN DEFAULT FALSE,
  results_sent BOOLEAN DEFAULT FALSE,
  results_sent_at TIMESTAMP WITH TIME ZONE,
  -- Additional metadata
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT
);

-- Create lead_results table (for storing ChatGPT API results)
CREATE TABLE lead_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_submission_id UUID REFERENCES lead_submissions(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,
  why_chosen TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_newsletter_signups_email ON newsletter_signups(email);
CREATE INDEX idx_newsletter_signups_signup_type ON newsletter_signups(signup_type);
CREATE INDEX idx_newsletter_signups_processing_status ON newsletter_signups(processing_status);
CREATE INDEX idx_newsletter_signups_created_at ON newsletter_signups(created_at);

CREATE INDEX idx_lead_submissions_email ON lead_submissions(email);
CREATE INDEX idx_lead_submissions_mode_id ON lead_submissions(mode_id);
CREATE INDEX idx_lead_submissions_processing_status ON lead_submissions(processing_status);
CREATE INDEX idx_lead_submissions_submitted_at ON lead_submissions(submitted_at);

CREATE INDEX idx_lead_results_lead_submission_id ON lead_results(lead_submission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_results ENABLE ROW LEVEL SECURITY;

-- Create policies to allow inserts (for form submissions)
CREATE POLICY "Enable insert for all users" ON newsletter_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON lead_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON lead_results
  FOR INSERT WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_newsletter_signups_updated_at
  BEFORE UPDATE ON newsletter_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data to verify structure
INSERT INTO newsletter_signups (email, signup_type) VALUES
  ('test@example.com', 'newsletter'),
  ('test2@example.com', 'pdf');

INSERT INTO lead_submissions (email, ref_company, mode, mode_id) VALUES
  ('lead@example.com', 'Apple Inc', 'General company leads', 'leads');
