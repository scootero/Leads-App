-- Create customers table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_signup_type ON customers(signup_type);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_customer_id ON lead_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_submitted_at ON lead_submissions(submitted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow inserts (for form submissions)
CREATE POLICY "Allow public inserts on customers" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public inserts on lead_submissions" ON lead_submissions
  FOR INSERT WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Create function to invoke newsletter welcome Edge Function
CREATE OR REPLACE FUNCTION trigger_newsletter_welcome()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the newsletter-welcome Edge Function
  PERFORM
    http_post(
      url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/newsletter-welcome',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'customer_id', NEW.id,
        'email', NEW.email,
        'signup_type', NEW.signup_type
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to invoke lead processor Edge Function
CREATE OR REPLACE FUNCTION trigger_lead_processor()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if signup_type is 'leads'
  IF NEW.signup_type = 'leads' THEN
    -- Call the lead-processor Edge Function
    PERFORM
      http_post(
        url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/lead-processor',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'customer_id', NEW.id,
          'email', NEW.email,
          'signup_type', NEW.signup_type
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for Edge Functions
CREATE TRIGGER trigger_newsletter_welcome_after_insert
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_newsletter_welcome();

CREATE TRIGGER trigger_lead_processor_after_insert
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_processor();

-- Create trigger for lead submissions to process individual leads
CREATE OR REPLACE FUNCTION trigger_lead_submission_processor()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the lead-processor Edge Function for the specific lead submission
  PERFORM
    http_post(
      url := 'https://gzhfvzzhrpqngvuxxdgs.supabase.co/functions/v1/lead-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'lead_submission_id', NEW.id,
        'customer_id', NEW.customer_id
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lead_submission_processor_after_insert
  AFTER INSERT ON lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_submission_processor();
