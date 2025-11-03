# Contact Enrichment Deployment Guide

This guide walks you through deploying the contact enrichment feature to your production environment.

## Prerequisites

1. Access to your Supabase project
2. OpenAI API key
3. Existing lead generation system already deployed

## Deployment Steps

### 1. Database Setup

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL scripts in order:
   - `sql/setup/contact-enrichment-schema.sql` - Creates tables and columns
   - `sql/setup/increment-function.sql` - Creates the increment function
   - `sql/setup/verify-contact-enrichment.sql` - Verifies and fixes any issues

### 2. Environment Variables

Add the OpenAI API key to your environment:

```
OPENAI_API_KEY=your-openai-api-key
```

Make sure this is set in:
- Your local development environment
- Your production environment
- Your Supabase Edge Functions environment (if applicable)

### 3. Code Deployment

Deploy the updated code to your hosting provider:

1. Push all code changes to your repository
2. Deploy using your normal deployment process (Vercel, Netlify, etc.)
3. Verify the deployment was successful

### 4. Testing

After deployment, test the contact enrichment feature:

1. Submit a new lead generation form
2. Check the database to see if a `contact_enrichment` job was created in the `processing_queue` table
3. Wait for the job to be processed (or trigger it manually)
4. Verify that contacts are being added to the `company_contacts` table
5. Check that the email sent to the customer includes contact information

### 5. Monitoring

Monitor the system to ensure it's working correctly:

1. Check the logs for any errors in the contact enrichment process
2. Monitor OpenAI API usage to ensure you're within your limits
3. Watch for any performance issues with the queue processing

## Troubleshooting

### Common Issues

1. **OpenAI API errors**
   - Check that your API key is valid
   - Verify you have sufficient credits
   - Check for rate limiting issues

2. **Database errors**
   - Run `sql/setup/verify-contact-enrichment.sql` to check for schema issues
   - Verify that all tables and columns exist
   - Check that RLS policies are correctly set up

3. **Queue processing issues**
   - Check that the cron job is running
   - Look for stuck jobs in the `processing_queue` table
   - Verify that the contact enrichment process is being triggered

## Rollback Plan

If you need to roll back the feature:

1. Remove the `contact_enrichment` job creation from the queue process
2. Update the email template to not reference contacts
3. The database changes can remain in place without affecting the system

## Future Improvements

Consider these future enhancements:

1. Add a UI for manually triggering contact enrichment for specific leads
2. Implement more sophisticated contact finding algorithms
3. Add a contact quality scoring system
4. Create a dedicated contacts management interface
