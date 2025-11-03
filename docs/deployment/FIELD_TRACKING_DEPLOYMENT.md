# Field Tracking Deployment Guide

This guide explains how to deploy the updated field tracking features for the contact enrichment system.

## Overview

We've enhanced the system to properly track various fields in the `lead_results` and `company_contacts` tables:

1. **In lead_results table:**
   - `contacts_found`: Boolean indicating if contacts were found for this company
   - `contacts_found_at`: Timestamp when contacts were found
   - `sent_to_customer`: Boolean indicating if this company was sent to a customer
   - `sent_at`: Timestamp when the company was sent to a customer
   - `times_used`: Counter tracking how many times this company was used
   - `last_used_at`: Timestamp when the company was last used

2. **In company_contacts table:**
   - `sent_to_customer`: Boolean indicating if this contact was sent to a customer
   - `sent_at`: Timestamp when the contact was sent to a customer
   - `times_used`: Counter tracking how many times this contact was used

## Deployment Steps

### 1. Database Schema Updates

Run the following SQL script in your Supabase SQL editor to add the missing fields:

```sql
\i /Users/scott/Programming/A__Lead-Gen-MVP-projects/Lead-gen-Cursor/Leads-2/leadspark-mvp/sql/setup/add-contacts-found-fields.sql
```

This script will:
- Add `contacts_found` and `contacts_found_at` fields to the `lead_results` table
- Add `last_used_at` field to the `lead_results` table
- Update existing records based on data in the `company_contacts` table

### 2. Code Deployment

Deploy the updated code to your hosting provider:

```bash
vercel deploy --prod
```

The code changes include:
- Updating the `saveCompanyContacts` function to set `contacts_found` and `contacts_found_at`
- Updating the email processing to increment `times_used` for contacts
- Updating the email processing to set `last_used_at` for companies

### 3. Verification

After deployment, verify that the fields are being properly populated:

1. Submit a new lead generation form
2. Check that the contact enrichment process populates `contacts_found` and `contacts_found_at`
3. Check that the email process updates `sent_to_customer`, `sent_at`, `times_used`, and `last_used_at`

You can use this SQL query to check the status:

```sql
SELECT
  lr.id,
  lr.company_name,
  lr.contacts_found,
  lr.contacts_found_at,
  lr.sent_to_customer,
  lr.sent_at,
  lr.times_used,
  lr.last_used_at,
  COUNT(cc.id) AS contact_count
FROM lead_results lr
LEFT JOIN company_contacts cc ON cc.lead_result_id = lr.id
GROUP BY lr.id, lr.company_name
ORDER BY lr.created_at DESC
LIMIT 10;
```

## Field Usage Guide

These fields enable several important features:

1. **Contact Tracking:**
   - `contacts_found` and `contacts_found_at` track when contacts were found for a company
   - You can use this to filter companies with contacts vs. those without

2. **Usage Tracking:**
   - `times_used` and `last_used_at` track how often a company/contact is used
   - This can be used for analytics and to prioritize less-used companies

3. **Email Tracking:**
   - `sent_to_customer` and `sent_at` track which companies/contacts were sent to customers
   - This prevents sending the same company to the same customer multiple times

## Troubleshooting

If fields are not being populated correctly:

1. Check the logs for any errors in the contact enrichment or email processes
2. Verify that the database schema was updated correctly
3. Ensure the increment function is working properly

You can manually update fields for testing:

```sql
UPDATE lead_results
SET contacts_found = true, contacts_found_at = NOW()
WHERE id = 'your-company-id';
```
