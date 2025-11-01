# Contact Enrichment Deployment Checklist

Use this checklist to ensure all components of the contact enrichment feature are properly deployed.

## Database Setup

- [ ] Run `sql/setup/contact-enrichment-schema.sql` to create:
  - [ ] `company_contacts` table
  - [ ] Additional columns in `lead_submissions`
  - [ ] Additional columns in `lead_results`
  - [ ] Indexes and RLS policies

- [ ] Run `sql/setup/increment-function.sql` to create:
  - [ ] `increment` function for tracking company usage

- [ ] Run `sql/setup/verify-contact-enrichment.sql` to:
  - [ ] Verify all tables and columns exist
  - [ ] Check RLS policies
  - [ ] Test functions
  - [ ] Fix any issues automatically

## Code Deployment

- [ ] Deploy updated files:
  - [ ] `/lib/contact-enrichment.ts` (new file)
  - [ ] `/app/api/process-queue/route.ts` (updated)
  - [ ] `/app/api/cron/process-queue/route.ts` (updated)

## Environment Variables

- [ ] Set `OPENAI_API_KEY` in all environments:
  - [ ] Development
  - [ ] Production
  - [ ] Supabase Edge Functions (if applicable)

## Testing

- [ ] Run `sql/testing/test-contact-enrichment.sql` to:
  - [ ] Create test data
  - [ ] Add a test job to the queue

- [ ] Trigger queue processing:
  - [ ] Check if contact enrichment job runs successfully
  - [ ] Verify contacts are added to `company_contacts` table
  - [ ] Check if email job is created and runs

- [ ] Test email delivery:
  - [ ] Verify email includes contact information
  - [ ] Check formatting of contacts in email

## Monitoring

- [ ] Set up monitoring for:
  - [ ] OpenAI API usage and errors
  - [ ] Queue processing errors
  - [ ] Contact enrichment success rate

## Documentation

- [ ] Review documentation:
  - [ ] `docs/CONTACT_ENRICHMENT.md`
  - [ ] `docs/DEPLOYMENT_GUIDE.md`
  - [ ] Updated README.md

## Post-Deployment

- [ ] Monitor system for 24 hours
- [ ] Check for any errors in logs
- [ ] Verify contact enrichment is working for real submissions
