import { supabaseAdmin } from '@/lib/supabase';

interface ContactInfo {
  name: string;
  role: string | null;
  email: string | null;
}

interface RawContactInfo {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

interface CompanyWithContacts {
  company_name: string;
  company_id: string;
  contacts: ContactInfo[];
}

interface OpenAICompanyResponse {
  company_name: string;
  company_id?: string;
  contacts?: RawContactInfo[];
  [key: string]: unknown;
}

/**
 * Validates a contact object to ensure it has reasonable field lengths
 */
function validateContact(contact: RawContactInfo): boolean {
  // Check if name exists and is a reasonable length
  if (!contact.name || typeof contact.name !== 'string' || contact.name.length > 100) {
    return false;
  }

  // Check if role is a reasonable length if it exists
  if (contact.role && (typeof contact.role !== 'string' || contact.role.length > 100)) {
    return false;
  }

  // Check if email is a reasonable length and format if it exists
  if (contact.email) {
    if (typeof contact.email !== 'string' || contact.email.length > 100) {
      return false;
    }

    // Basic email format validation
    if (!contact.email.includes('@') || !contact.email.includes('.')) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a string to prevent excessively long values
 */
function sanitizeString(str: string | undefined | null, maxLength: number = 100): string | null {
  if (!str) return null;
  return str.substring(0, maxLength);
}

/**
 * Finds contacts for a list of companies using ChatGPT
 */
export async function findCompanyContacts(companies: { id: string; company_name: string; website: string | null }[]): Promise<CompanyWithContacts[]> {
  // Define rawContent at the top level scope so it's accessible in catch blocks
  let rawContent = "";
  console.log('🔍 Finding contacts for companies:', companies.map(c => c.company_name).join(', '));

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const companyList = companies.map(company => `
    - Company: ${company.company_name}
    - Website: ${company.website || 'Not available'}
    - ID: ${company.id}
  `).join('\n');

  const prompt = `
You are an expert at finding business contacts. For each of the following companies, find real people who work there, focusing on leadership, sales, or decision-makers.

Companies to research:
${companyList}

For each company:
1. Visit their website if available
2. Look specifically on pages like "About Us", "Our Team", "Leadership", "Contact Us", etc.
3. Find as many real people as possible who work at the company (at least 1-3 per company if possible)
4. For each person, get their:
   - Full name
   - Role/title at the company
   - Email address (if available)

If you cannot find specific people for a company, provide any general contact emails (like sales@company.com, info@company.com).

IMPORTANT CONSTRAINTS:
- All names, roles, and emails MUST be under 100 characters
- NEVER generate fictional or repetitive content (like repeating characters)
- If you're uncertain about information, omit it rather than guessing
- Ensure all JSON is valid and properly formatted
- Emails must be in a valid format (contain @ and a domain)

Return the results as a valid JSON array with this structure:
[
  {
    "company_name": "Exact Company Name",
    "company_id": "id-from-input",
    "contacts": [
      {
        "name": "Person Full Name",
        "role": "Job Title",
        "email": "email@company.com"
      },
      {
        "name": "Another Person",
        "role": "Another Title",
        "email": "another@company.com"
      }
    ]
  }
]

Make sure to return valid JSON that can be parsed.
  `;

  console.log('📤 Sending contact finding request to OpenAI API...');

  // Create an AbortController to implement a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are a business contact research expert. Find real people at companies based on their websites and public information. Always return valid JSON with the requested structure. NEVER generate fictional data or repetitive patterns like "KKKKKK". All fields must be under 100 characters. If uncertain, omit information rather than guessing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    rawContent = data.choices[0].message.content;
    console.log('✅ OpenAI API Response received');
    console.log('📊 Usage:', JSON.stringify(data.usage, null, 2));
    console.log('📄 Raw ChatGPT response preview:', rawContent.substring(0, 500) + '...');
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ OpenAI API request timed out after 30 seconds');
      throw new Error('OpenAI API request timed out after 30 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedContent = rawContent.trim();

    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('🧹 Cleaned content preview:', cleanedContent.substring(0, 200) + '...');

    // Check for extremely long strings or repetitive patterns that might indicate malformed data
    if (/(.)(\\1{50,})/.test(cleanedContent)) {
      console.warn('⚠️ Detected repetitive pattern in response, attempting to fix...');
      // Try to fix repetitive patterns
      cleanedContent = cleanedContent.replace(/(.)(\\1{50,})/g, '$1');
    }

    // Try to parse the JSON, with fallback to a more lenient approach if it fails
    let parsedData: OpenAICompanyResponse[];
    try {
      parsedData = JSON.parse(cleanedContent) as OpenAICompanyResponse[];
    } catch (parseError) {
      console.warn('⚠️ Initial JSON parsing failed, attempting recovery...');

      // Try to extract just the valid part of the JSON
      try {
        // Find the last valid closing bracket
        const lastBracketIndex = cleanedContent.lastIndexOf(']');
        if (lastBracketIndex > 0) {
          const truncatedJson = cleanedContent.substring(0, lastBracketIndex + 1);
          parsedData = JSON.parse(truncatedJson) as OpenAICompanyResponse[];
          console.log('✅ Recovered partial JSON data');
        } else {
          throw new Error('Could not find valid JSON structure');
        }
      } catch (recoveryError) {
        console.error('❌ Recovery attempt failed:', recoveryError);
        throw new Error(`Failed to parse ChatGPT response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }

    console.log('✅ Successfully parsed ChatGPT response');

    // Validate the structure
    if (!Array.isArray(parsedData)) {
      throw new Error('Invalid response format from ChatGPT - expected array');
    }

    // Make sure we have the right company IDs
    const companiesMap = new Map(companies.map(c => [c.company_name.toLowerCase(), c]));

    const validatedData = parsedData.map((item: OpenAICompanyResponse) => {
      try {
        // Try to match the company by name
        const companyKey = item.company_name?.toLowerCase() || '';
        const company = companiesMap.get(companyKey) ||
                        companies.find(c => item.company_id === c.id) ||
                        companies.find(c => c.company_name.toLowerCase().includes(companyKey) ||
                                           companyKey.includes(c.company_name.toLowerCase()));

        if (!company) {
          console.warn(`⚠️ Could not match company: ${item.company_name}`);
          return null;
        }

        // Validate and sanitize contacts
        const validContacts = Array.isArray(item.contacts)
          ? item.contacts
              .filter(c => validateContact(c))
              .map(c => ({
                name: sanitizeString(c.name) || '',
                role: sanitizeString(c.role),
                email: sanitizeString(c.email)
              }))
          : [];

        return {
          company_name: company.company_name,
          company_id: company.id,
          contacts: validContacts
        };
      } catch (error) {
        console.warn(`⚠️ Error processing company data: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
    }).filter((item): item is CompanyWithContacts => item !== null);

    console.log(`🏢 Found contacts for ${validatedData.length} companies`);
    return validatedData;

  } catch (parseError) {
    console.error('❌ Failed to parse ChatGPT contact response:', parseError);
    console.error('📄 Raw response that failed to parse:', rawContent);
    throw new Error(`Failed to parse ChatGPT contact response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

/**
 * Saves company contacts to the database
 */
export async function saveCompanyContacts(companyId: string, contacts: ContactInfo[]) {
  console.log(`💾 Saving ${contacts.length} contacts for company ID ${companyId}`);

  if (!contacts.length) {
    console.log('⚠️ No contacts to save');
    return;
  }

  const rows = contacts.map((contact, index) => ({
    lead_result_id: companyId,
    contact_name: contact.name,
    contact_email: contact.email || null,
    contact_role: contact.role || null,
    is_primary: index === 0, // First contact is primary
    times_used: 0,
    sent_to_customer: false,
    sent_at: null
  }));

  console.log('📝 Prepared rows for insertion:', rows.length);

  const { error: insertError } = await supabaseAdmin
    .from('company_contacts')
    .upsert(rows, {
      onConflict: 'lead_result_id,contact_email',
      ignoreDuplicates: false
    });

  if (insertError) {
    console.error('❌ Database insertion failed:', insertError);
    throw new Error(`Failed to insert contacts: ${insertError.message}`);
  }

  // Update the lead_results record to indicate contacts were found
  await supabaseAdmin
    .from('lead_results')
    .update({
      contacts_found: true,
      contacts_found_at: new Date().toISOString()
    })
    .eq('id', companyId);

  console.log(`✅ Successfully saved ${rows.length} contacts for company ID ${companyId}`);
}

interface ProcessingResult {
  enrichedCount: number;
  companiesWithContactsCount: number;
}

/**
 * Process contact enrichment for a lead submission
 */
export async function processContactEnrichment(job: { id: string; data: { lead_submission_id: string }; attempts: number; max_attempts: number }): Promise<ProcessingResult> {
  const leadId = job.data.lead_submission_id;

  if (!leadId) {
    throw new Error('Missing lead_submission_id in job data');
  }

  console.log(`👤 Processing contact enrichment for submission: ${leadId}`);

  // Update status to processing
  await supabaseAdmin
    .from('lead_submissions')
    .update({
      contacts_enriched: false,
      contacts_enrichment_error: null
    })
    .eq('id', leadId);

  try {
    // Get companies from lead_results
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('lead_results')
      .select('id, company_name, website')
      .eq('lead_submission_id', leadId)
      .order('rank', { ascending: true });

    if (companiesError || !companies || companies.length === 0) {
      throw new Error(`Companies not found: ${companiesError?.message || 'No companies found'}`);
    }

    console.log(`🏢 Found ${companies.length} companies to enrich with contacts`);

    // Process companies in batches to avoid API rate limits
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < companies.length; i += batchSize) {
      batches.push(companies.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${batches.length} batches of companies`);

    let enrichedCount = 0;
    let companiesWithContactsCount = 0;

    for (const batch of batches) {
      try {
        // Get contacts for this batch of companies
        const enrichedCompanies = await findCompanyContacts(batch);

        // Save the enriched data
        for (const company of enrichedCompanies) {
          if (company.contacts && company.contacts.length > 0) {
            await saveCompanyContacts(company.company_id, company.contacts);
            enrichedCount += company.contacts.length;
            companiesWithContactsCount++;
          }
        }

        // Small delay between batches to avoid rate limits
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error processing batch: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with next batch even if one fails
      }
    }

    console.log(`✅ Contact enrichment completed: ${enrichedCount} contacts found across ${companiesWithContactsCount} companies`);

    // Update lead submission status
    await supabaseAdmin
      .from('lead_submissions')
      .update({
        contacts_enriched: true,
        contacts_enriched_at: new Date().toISOString()
      })
      .eq('id', leadId);

    return {
      enrichedCount,
      companiesWithContactsCount
    };

  } catch (error) {
    console.error(`❌ Contact enrichment failed: ${error instanceof Error ? error.message : String(error)}`);

    // Update lead with error
    await supabaseAdmin
      .from('lead_submissions')
      .update({
        contacts_enriched: false,
        contacts_enrichment_error: error instanceof Error ? error.message : String(error)
      })
      .eq('id', leadId);

    throw error;
  }
}