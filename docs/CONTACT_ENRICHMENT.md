# Contact Enrichment Feature

This document explains the contact enrichment feature that automatically finds contact information for lead companies.

## Overview

The contact enrichment process runs after the initial lead generation. It takes the generated companies and uses ChatGPT to find real people who work at these companies, including their names, roles, and email addresses when available.

## Database Schema

The feature uses the following database structure:

1. **company_contacts table**: Stores multiple contacts per company
   - `id`: UUID primary key
   - `lead_result_id`: Foreign key to lead_results table
   - `contact_name`: Name of the contact person
   - `contact_email`: Email address (if available)
   - `contact_role`: Job title/role (if available)
   - `is_primary`: Boolean indicating if this is the primary contact
   - `sent_to_customer`: Boolean tracking if this contact was sent to a customer
   - `sent_at`: Timestamp when the contact was sent to a customer
   - `created_at`: Timestamp when the contact was created

2. **Additional fields in lead_submissions**:
   - `contacts_enriched`: Boolean indicating if contact enrichment is complete
   - `contacts_enriched_at`: Timestamp when contact enrichment completed
   - `contacts_enrichment_error`: Error message if contact enrichment failed

3. **Additional fields in lead_results**:
   - `sent_to_customer`: Boolean tracking if this company was sent to a customer
   - `sent_at`: Timestamp when the company was sent to a customer
   - `times_used`: Counter tracking how many times this company was used in emails

## Process Flow

1. When a lead submission is processed, it triggers two queue jobs:
   - `contact_enrichment`: Higher priority (2), runs immediately
   - `lead_results_email`: Lower priority (1), runs after a 1-minute delay

2. The contact enrichment process:
   - Retrieves companies from the lead_results table
   - Processes them in batches of 5 to avoid API rate limits
   - Uses ChatGPT to find contacts for each company
   - Saves contacts to the company_contacts table
   - Updates the lead_submissions table with enrichment status

3. The email process:
   - Retrieves companies with their contacts
   - Sends an email with the top 10 companies and their contacts
   - Marks companies and contacts as sent to the customer
   - Increments the usage counter for each company

## ChatGPT Prompt

The contact enrichment uses a specialized prompt that instructs ChatGPT to:

1. Visit each company's website
2. Look for contact information on pages like "About Us", "Our Team", "Leadership", etc.
3. Find real people who work at the company, focusing on leadership, sales, or decision-makers
4. Get their names, roles, and email addresses when available
5. Return the data in a structured JSON format

## Email Template

The email template has been enhanced to include contact information when available:

- Each company listing now has a "Contacts" section
- For each contact, it shows:
  - Name
  - Role (if available)
  - Email address (if available)
- The contacts are highlighted in a green box to make them stand out

## Tracking

The system tracks:

1. Which companies were sent to which customers
2. When they were sent
3. How many times each company has been used
4. Which contacts were sent to customers

This allows for future features like:
- Avoiding sending the same company to the same customer twice
- Prioritizing companies that haven't been used much
- Analytics on which companies and contacts are most valuable

## Future Improvements

Potential future enhancements:

1. Email scraping script to get more accurate contact information
2. UI for users to request additional contact information for specific companies
3. More sophisticated contact database that tracks contact quality and engagement
4. Integration with CRM systems to automatically import contacts
