# SQL Files Organization

## 📁 **sql/setup/** - Database Setup Files
**Use these to set up your database from scratch:**

- `create-queue-system.sql` - **MAIN SETUP FILE** - Creates the complete system
- `supabase-schema.sql` - Original schema with triggers
- `supabase-schema-fixed.sql` - Fixed version of the schema
- `step-by-step-schema.sql` - Step-by-step setup instructions
- `continue-schema.sql` - Continue setup after initial tables
- `minimal-schema.sql` - Minimal schema without triggers
- `add-triggers.sql` - Add triggers to existing tables
- `add-triggers-only.sql` - Add only triggers (no test data)
- `create-simple-triggers.sql` - Simple trigger setup
- `fix-triggers-pgnet.sql` - Fix triggers for pg_cron
- `fix-rls-policies.sql` - Fix Row Level Security policies
- `fix-schema.sql` - Fix schema issues

## 📁 **sql/testing/** - Testing Files
**Use these to test your system:**

- `test-all-form-types.sql` - Test all three form types
- `test-api-forms.js` - JavaScript test for API endpoints
- `test-edge-functions-manual.sql` - Manual Edge Function testing
- `test-edge-functions.js` - JavaScript Edge Function testing
- `test-email-manually.sql` - Manual email testing
- `test-fresh-email.sql` - Test with fresh email addresses
- `test-manual-queue.sql` - Manual queue testing
- `test-newsletter-table.sql` - Newsletter table testing
- `test-pgnet.sql` - pg_cron testing
- `test-rls-fix.sql` - RLS policy testing
- `test-system-clean.sql` - Clean system testing
- `test-system-unique.sql` - Unique email testing
- `simple-debug.sql` - Simple debugging queries
- `debug-email-issue.sql` - Email debugging
- `delete-test-entries.sql` - Clean up test data

## 📁 **sql/debug/** - Debugging Files
**Use these to troubleshoot issues:**

- `check-database-state.sql` - Check current database state
- `check-existing-schema.sql` - Check existing schema
- `check-trigger-logs.sql` - Check trigger logs
- `diagnose-issue.sql` - Diagnose common issues
- `debug-tables.sql` - Debug table issues

## 📁 **sql/archive/** - Archived Files
**Old files that are no longer needed:**

- `work-with-existing-schema.sql` - Work with existing schema
- `new-schema.sql` - New schema approach
- `create-lead-submissions-table.sql` - Create lead submissions table
- `fix-lead-submissions-table.sql` - Fix lead submissions table
- `fix-supabase-policies.sql` - Fix Supabase policies

## 🚀 **Quick Start:**

1. **For new setup**: Use `sql/setup/create-queue-system.sql`
2. **For testing**: Use `sql/testing/test-all-form-types.sql`
3. **For debugging**: Use `sql/debug/simple-debug.sql`

## 📋 **Most Important Files:**

- ✅ `sql/setup/create-queue-system.sql` - Complete system setup
- ✅ `sql/testing/test-all-form-types.sql` - Test all forms
- ✅ `sql/testing/delete-test-entries.sql` - Clean up test data
- ✅ `sql/debug/simple-debug.sql` - Quick debugging
