# Contact Enrichment Deployment Instructions

This document provides step-by-step instructions for deploying the contact enrichment feature.

## Database Setup

Since you already have the `company_contacts` table, we need to enhance it and add the necessary columns to other tables:

1. First, run the script to enhance the lead tables:

```sql
-- Run in Supabase SQL Editor
\i /Users/scott/Programming/A__Lead-Gen-MVP-projects/Lead-gen-Cursor/Leads-2/leadspark-mvp/sql/setup/enhance-lead-tables.sql
```

2. Next, run the script to enhance the company_contacts table:

```sql
-- Run in Supabase SQL Editor
\i /Users/scott/Programming/A__Lead-Gen-MVP-projects/Lead-gen-Cursor/Leads-2/leadspark-mvp/sql/setup/enhance-company-contacts-simple.sql
```

These scripts will:
- Add necessary columns to `lead_submissions` and `lead_results`
- Create required indexes
- Create the `increment` function
- Enhance the `company_contacts` table with any missing columns
- Set up RLS policies
- Verify all changes

## Code Deployment

1. Deploy the new contact enrichment module:
   - `lib/contact-enrichment.ts`

2. Update the queue processing routes:
   - `app/api/process-queue/route.ts`
   - `app/api/cron/process-queue/route.ts`

3. Set the OpenAI API key in your environment variables:
   ```
   OPENAI_API_KEY=your-openai-api-key
   ```

## Testing

After deployment, you can test the contact enrichment feature:

```sql
-- Run in Supabase SQL Editor
\i /Users/scott/Programming/A__Lead-Gen-MVP-projects/Lead-gen-Cursor/Leads-2/leadspark-mvp/sql/testing/test-contact-enrichment.sql
```

This will:
1. Create a test customer and lead submission
2. Add test companies
3. Create a contact enrichment job
4. Provide instructions for testing

## Troubleshooting

If you encounter any issues:

1. Check the logs for errors
2. Verify all database objects exist:
   ```sql
   -- Run in Supabase SQL Editor
   \i /Users/scott/Programming/A__Lead-Gen-MVP-projects/Lead-gen-Cursor/Leads-2/leadspark-mvp/sql/setup/verify-contact-enrichment.sql
   ```

3. Common issues:
   - OpenAI API key not set or invalid
   - Missing columns or tables
   - RLS policies not properly configured

## Schema Comparison

Here's a comparison of your existing company_contacts schema and our enhancements:

| Your Schema | Our Enhancements |
|-------------|------------------|
| id (UUID) | Same |
| lead_result_id (UUID) | Same |
| name (TEXT) | Renamed to contact_name |
| role (TEXT) | Renamed to contact_role |
| email (TEXT) | Renamed to contact_email |
| linkedin_url (TEXT) | Preserved |
| is_primary (BOOLEAN) | Same |
| times_used (INTEGER) | Same |
| created_at (TIMESTAMPTZ) | Same |
| updated_at (TIMESTAMPTZ) | Same |
| | Added sent_to_customer (BOOLEAN) |
| | Added sent_at (TIMESTAMPTZ) |
| | Added unique constraint on (lead_result_id, contact_email) |

The enhancements preserve all your existing columns while adding tracking for which contacts were sent to customers.

## Next Steps

After deployment:

1. Monitor the system for 24 hours
2. Check that contact enrichment jobs are being processed
3. Verify contacts are being found and stored
4. Test that emails include contact information
