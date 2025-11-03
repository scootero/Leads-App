# SQL Directory Structure

This directory contains all SQL scripts for the LeadSpark application.

## Directory Structure

- **migrations/**: Contains all schema changes that have been applied to the database
  - `add-contacts-found-fields.sql`: Adds contact tracking fields to lead_results table
  - `enhance-company-contacts-simple.sql`: Enhances the company_contacts table structure
  - `enhance-lead-tables.sql`: Adds fields to lead_submissions and lead_results tables
  - `lead-automation-schema.sql`: Initial schema for lead automation
  - `queue-improvements-final.sql`: Queue system improvements
  - `supabase-schema.sql`: Base Supabase schema
  - `verify-contact-enrichment.sql`: Script to verify contact enrichment setup

- **functions/**: Contains standalone SQL functions
  - `increment-function-standalone.sql`: Function to increment a counter field

- **testing/**: Contains scripts for testing and debugging
  - Various test scripts for different features

- **archive/**: Contains old scripts that are no longer used but kept for reference
  - Legacy scripts

- **debug/**: Contains scripts for debugging database issues
  - Diagnostic scripts

## Usage

To run a script in the Supabase SQL editor:

```sql
\i /path/to/script.sql
```

For example:

```sql
\i /sql/migrations/add-contacts-found-fields.sql
```

## Best Practices

1. Always back up your database before running migration scripts
2. Test scripts in a development environment before applying to production
3. Keep scripts idempotent (can be run multiple times without side effects)
4. Document all schema changes in the script comments