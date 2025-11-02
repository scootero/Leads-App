import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { processContactEnrichment } from '@/lib/contact-enrichment';

// Import all the processing functions directly
async function processLeadGeneration(job: { id: string; data: { lead_submission_id: string }; attempts: number; max_attempts: number }) {
  const leadId = job.data.lead_submission_id;

  if (!leadId) {
    throw new Error('Missing lead_submission_id in job data');
  }

  console.log(`📝 Processing lead generation for submission: ${leadId}`);

  // Get lead data
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('lead_submissions')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(`Lead submission not found: ${leadError?.message}`);
  }

  console.log(`🏢 Processing lead for company: ${lead.ref_company}`);

  // Update status to processing
  await supabaseAdmin
    .from('lead_submissions')
    .update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .eq('id', leadId);

  try {
    // Call ChatGPT
    const companies = await generateCompanies(lead);

    // Save to lead_results
    await saveCompanies(leadId, companies);

    // Update lead status
    await supabaseAdmin
      .from('lead_submissions')
      .update({
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        results_generated: true
      })
      .eq('id', leadId);

    // Add contact enrichment job to queue
    await supabaseAdmin
      .from('processing_queue')
      .insert({
        type: 'contact_enrichment',
        data: { lead_submission_id: leadId },
        priority: 2, // Higher priority than email
        status: 'queued',
        run_at: new Date().toISOString()
      });

    // Add email job to queue (will run after contact enrichment)
    await supabaseAdmin
      .from('processing_queue')
      .insert({
        type: 'lead_results_email',
        data: { lead_submission_id: leadId },
        priority: 1,
        status: 'queued',
        run_at: new Date(Date.now() + 60000).toISOString() // Delay by 1 minute to allow contact enrichment to complete
      });

    console.log(`✅ Lead generation completed for ${lead.ref_company}: ${companies.length} companies found`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Update lead with error
    await supabaseAdmin
      .from('lead_submissions')
      .update({
        processing_status: 'failed',
        processing_error: errorMessage,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', leadId);

    throw error;
  }
}

async function generateCompanies(lead: { ref_company: string; industry?: string; region?: string; keywords?: string; mode?: string; mode_id?: string }) {
  console.log('🤖 Starting ChatGPT API call...');
  console.log('📝 Input data:', {
    ref_company: lead.ref_company,
    industry: lead.industry,
    region: lead.region,
    keywords: lead.keywords,
    mode: lead.mode
  });

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const prompt = `
You are a business research expert. Find 20 REAL, ACTUAL companies similar to "${lead.ref_company}".

IMPORTANT: Return ONLY REAL COMPANY NAMES, not generic placeholders like "Company A" or "Company B".

Reference Company: ${lead.ref_company}
Industry: ${lead.industry || 'Not specified'}
Region: ${lead.region || 'Not specified'}
Keywords: ${lead.keywords || 'Not specified'}
Mode: ${lead.mode} (${lead.mode_id})

Find:
- 10 core companies: Direct competitors or very similar businesses to ${lead.ref_company}
- 10 adjacent companies: Related businesses that could be prospects

For each company provide REAL information:
- name: ACTUAL company name (e.g., "Tesla", "Microsoft", "Salesforce")
- url: Real website URL (if available)
- industry: Actual industry/sector
- size: Company size (startup/small/medium/large/enterprise)
- location: Geographic location
- why_chosen: Brief reason why this company is similar/ideal

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Company Name",
    "url": "https://company.com",
    "industry": "Technology",
    "size": "medium",
    "location": "United States",
    "why_chosen": "Similar business model and target market"
  }
]

Make sure the JSON is valid and contains exactly 20 companies.
  `;

  console.log('📤 Sending request to OpenAI API...');
  console.log('🔑 API Key present:', !!openaiApiKey);
  console.log('📋 Prompt preview:', prompt.substring(0, 200) + '...');

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
          content: 'You are a business research expert. Find REAL, ACTUAL companies based on business characteristics, industry, and target market. NEVER use generic placeholders like "Company A" or "Company B". Always return valid JSON with real company names like "Tesla", "Microsoft", "Salesforce", etc.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000
    })
  });

  console.log('📥 OpenAI API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ OpenAI API Error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ OpenAI API Response received');
  console.log('📊 Usage:', JSON.stringify(data.usage, null, 2));

  const rawContent = data.choices[0].message.content;
  console.log('📄 Raw ChatGPT response preview:', rawContent.substring(0, 500) + '...');

  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedContent = rawContent.trim();

    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('🧹 Cleaned content preview:', cleanedContent.substring(0, 200) + '...');

    const parsedData = JSON.parse(cleanedContent);
    console.log('✅ Successfully parsed ChatGPT response');

    // Handle both old format (array) and new format (core/adjacent)
    let companies;
    if (parsedData.core && parsedData.adjacent) {
      // New format: core + adjacent
      companies = [...parsedData.core, ...parsedData.adjacent];
      console.log('🏢 Core companies found:', parsedData.core.length);
      console.log('🔗 Adjacent companies found:', parsedData.adjacent.length);
    } else if (Array.isArray(parsedData)) {
      // Old format: simple array
      companies = parsedData;
      console.log('🏢 Companies found:', companies.length);
    } else {
      throw new Error('Invalid response format from ChatGPT - expected core/adjacent or array');
    }

    console.log('📋 Sample company:', companies[0]);
    return companies.slice(0, 20); // Ensure max 20 companies
  } catch (parseError: unknown) {
    const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    console.error('❌ Failed to parse ChatGPT response:', parseError);
    console.error('📄 Raw response that failed to parse:', rawContent);
    console.error('🧹 Cleaned content:', rawContent.trim().substring(0, 500));
    throw new Error(`Failed to parse ChatGPT response: ${parseErrorMessage}`);
  }
}

async function saveCompanies(leadId: string, companies: { name: string; url?: string; industry?: string; size?: string; location?: string; why_chosen?: string }[]) {
  console.log('💾 Saving companies to database...');
  console.log('📊 Total companies to insert:', companies.length);

  const rows = companies.map((company, index) => ({
    lead_submission_id: leadId,
    rank: index + 1,
    company_name: company.name,
    website: company.url || null,
    industry: company.industry || null,
    company_size: company.size || null,
    location: company.location || null,
    why_chosen: company.why_chosen || null
  }));

  console.log('📝 Prepared rows for insertion:', rows.length);
  console.log('📋 Sample row:', JSON.stringify(rows[0], null, 2));

  const { error: insertError } = await supabaseAdmin
    .from('lead_results')
    .upsert(rows, {
      onConflict: 'lead_submission_id,rank',
      ignoreDuplicates: false
    });

  if (insertError) {
    console.error('❌ Database insertion failed:', insertError);
    throw new Error(`Failed to insert companies: ${insertError.message}`);
  }

  console.log('✅ Successfully inserted companies into database');
}

async function processContactEnrichmentJobs() {
  console.log('👤 Processing contact enrichment jobs...');

  const { data: contactJobs, error: claimError } = await supabaseAdmin.rpc('claim_queue', {
    p_type: 'contact_enrichment',
    p_limit: 2 // Lower limit to avoid API rate limits
  });

  if (claimError) {
    console.error('❌ Error claiming contact enrichment jobs:', claimError);
    return;
  }

  if (!contactJobs || contactJobs.length === 0) {
    console.log('📋 No contact enrichment jobs to process');
    return;
  }

  console.log(`📋 Found ${contactJobs.length} contact enrichment jobs to process`);

  for (const job of contactJobs) {
    try {
      console.log(`🚀 Processing contact enrichment job ${job.id} (attempt ${job.attempts + 1}/${job.max_attempts})`);
      await processContactEnrichment(job);
      await markJobCompleted(job.id);
      console.log(`✅ Successfully processed contact enrichment job ${job.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Contact enrichment job ${job.id} failed:`, errorMessage);
      await markJobFailed(job.id, job.attempts, errorMessage);
    }
  }
}

async function processEmailJobs() {
  console.log('📧 Processing email jobs...');

  const { data: emailJobs, error: claimError } = await supabaseAdmin.rpc('claim_queue', {
    p_type: 'lead_results_email',
    p_limit: 3
  });

  if (claimError) {
    console.error('❌ Error claiming email jobs:', claimError);
    return;
  }

  if (!emailJobs || emailJobs.length === 0) {
    console.log('📋 No email jobs to process');
    return;
  }

  console.log(`📋 Found ${emailJobs.length} email jobs to process`);

  for (const job of emailJobs) {
    try {
      // Process one email job at a time to avoid timeouts
      await processEmailJob(job);
      await markJobCompleted(job.id);
      console.log(`✅ Successfully processed email job ${job.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Email job ${job.id} failed:`, errorMessage);
      await markJobFailed(job.id, job.attempts, errorMessage);
    }
  }
}

// Modified to be more efficient and avoid timeouts
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface CompanyContact {
  id: string;
  contact_name: string;
  contact_email?: string;
  contact_role?: string;
}

interface CompanyWithContacts {
  id: string;
  company_name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  why_chosen?: string;
  company_contacts?: CompanyContact[];
}

async function processEmailJob(job: { id: string; data: { lead_submission_id: string; customer_id?: string; companies_count?: number } }) {
  const leadId = job.data.lead_submission_id;

  if (!leadId) {
    throw new Error('Missing lead_submission_id in email job data');
  }

  console.log(`📧 Processing email for lead submission: ${leadId}`);

  try {
    // Get lead submission with customer email
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead_submissions')
      .select(`
        *,
        customers!inner(email)
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead submission not found: ${leadError?.message}`);
    }

    // Get generated companies with contacts (top 10 for email)
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('lead_results')
      .select(`
        *,
        company_contacts(*)
      `)
      .eq('lead_submission_id', leadId)
      .order('rank', { ascending: true })
      .limit(10) as { data: CompanyWithContacts[] | null, error: SupabaseError | null };

    if (companiesError || !companies) {
      throw new Error(`Companies not found: ${companiesError?.message}`);
    }

    console.log(`📧 Sending email to: ${lead.customers.email}`);
    console.log(`📊 Companies to include: ${companies.length}`);

    // Send the email
    await sendLeadResultsEmail(lead.customers.email, lead.ref_company, companies);

    // Mark results as sent in a single operation
    const companyIds = companies.map(company => company.id);
    const contactIds = companies.flatMap(company =>
      company.company_contacts?.map(contact => contact.id) || []
    );

    // Batch update operations
    await Promise.all([
      // 1. Update lead submission
      supabaseAdmin
        .from('lead_submissions')
        .update({
          results_sent: true,
          results_sent_at: new Date().toISOString()
        })
        .eq('id', leadId),

      // 2. Update all companies in one batch if there are any
      companyIds.length > 0 ?
        supabaseAdmin
          .from('lead_results')
          .update({
            sent_to_customer: true,
            sent_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            times_used: supabaseAdmin.rpc('increment', { row_id: companyIds[0] }) // Increment just the first one for now
          })
          .in('id', companyIds) :
        Promise.resolve(),

      // 3. Update all contacts in one batch if there are any
      contactIds.length > 0 ?
        Promise.all(contactIds.map(contactId =>
          supabaseAdmin
            .from('company_contacts')
            .update({
              sent_to_customer: true,
              sent_at: new Date().toISOString(),
              times_used: supabaseAdmin.rpc('increment', { row_id: contactId })
            })
            .eq('id', contactId)
        )) :
        Promise.resolve()
    ]);

    console.log(`✅ Email sent and all records updated for lead ${leadId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing email job:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function sendLeadResultsEmail(email: string, refCompany: string, companies: CompanyWithContacts[]) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable not set');
  }

  const companiesList = companies.map((company, index) => {
    // Format contacts if available
    const contactsHtml = company.company_contacts && company.company_contacts.length > 0
      ? `
        <div style="background-color: #f0fff4; padding: 12px; border-radius: 6px; margin: 10px 0;">
          <h4 style="margin: 0 0 8px 0; color: #047857;">Contacts:</h4>
          ${company.company_contacts.map(contact => `
            <div style="margin-bottom: 8px;">
              <p style="margin: 3px 0;"><strong>${contact.contact_name}</strong>${contact.contact_role ? ` - ${contact.contact_role}` : ''}</p>
              ${contact.contact_email ? `<p style="margin: 3px 0;"><a href="mailto:${contact.contact_email}">${contact.contact_email}</a></p>` : ''}
            </div>
          `).join('')}
        </div>
      `
      : '';

    return `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2563eb;">${index + 1}. ${company.company_name}</h3>
      ${company.website ? `<p style="margin: 5px 0;"><strong>Website:</strong> <a href="${company.website}" target="_blank">${company.website}</a></p>` : ''}
      ${company.industry ? `<p style="margin: 5px 0;"><strong>Industry:</strong> ${company.industry}</p>` : ''}
      ${company.company_size ? `<p style="margin: 5px 0;"><strong>Size:</strong> ${company.company_size}</p>` : ''}
      ${company.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${company.location}</p>` : ''}
      ${contactsHtml}
      ${company.why_chosen ? `<p style="margin: 5px 0;"><strong>Why chosen:</strong> ${company.why_chosen}</p>` : ''}
    </div>
    `;
  }).join('');

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Your Lead List is Ready! 🎯</h1>
      <p>Great news! We've generated <strong>${companies.length} similar companies</strong> based on your reference company: <strong>${refCompany}</strong></p>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 15px 0; color: #1e40af;">Your Free Lead List</h2>
        ${companiesList}
      </div>

      <p>These companies have been carefully selected based on your criteria and are ideal prospects for your business.</p>

      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>💡 Pro Tip:</strong> Use this list to start your outreach campaigns. Each company has been chosen for its similarity to your reference company.</p>
      </div>

      <p>Best regards,<br><strong>The LeadApp Team</strong></p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">You received this email because you requested lead generation for ${refCompany}.</p>
    </div>
  `;

  const textLines = companies.map((company, index) => {
    let line = `${index + 1}. ${company.company_name}${company.website ? ` — ${company.website}` : ""}`;

    // Add contacts to plain text version
    if (company.company_contacts && company.company_contacts.length > 0) {
      const contacts = company.company_contacts.map(c =>
        `   - ${c.contact_name}${c.contact_role ? `, ${c.contact_role}` : ''}${c.contact_email ? ` (${c.contact_email})` : ''}`
      ).join("\n");
      line += "\n" + contacts;
    }

    return line;
  }).join("\n\n");

  console.log('📤 Sending email via Resend...');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LeadApp <noreply@designsmidwestsales.com>',
      to: [email],
      subject: `Your Free Lead List: ${companies.length} Companies Similar to ${refCompany}`,
      text: `Here are your companies:\n\n${textLines}\n\nReply if you want contacts added.`,
      html: emailTemplate
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Resend API error:', errorText);
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Email sent successfully:', result.id);
}

async function markJobCompleted(jobId: string) {
  await supabaseAdmin
    .from('processing_queue')
    .update({ status: 'succeeded' })
    .eq('id', jobId);
}

async function markJobFailed(jobId: string, attempts: number, errorMessage: string) {
  const backoffSeconds = Math.min(900, Math.pow(2, attempts) * 10);
  const nextRunAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

  await supabaseAdmin.rpc('bump_attempt', {
    p_id: jobId,
    p_next_run_at: nextRunAt,
    p_error: errorMessage
  });
}

// Main cron handler
export async function GET(request: Request) {
  try {
    // Verify the secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token-change-this';

    // Debug logging
    console.log('🔍 Auth Debug:', {
      hasHeader: !!authHeader,
      headerLength: authHeader?.length,
      headerPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
      hasToken: !!expectedToken,
      tokenLength: expectedToken?.length,
      tokenPreview: expectedToken ? `${expectedToken.substring(0, 10)}...` : 'none'
    });

    // More flexible token comparison (case-insensitive, strip whitespace)
    const normalizedHeader = authHeader?.trim().toLowerCase();
    const normalizedExpected = `bearer ${expectedToken}`.trim().toLowerCase();

    if (!normalizedHeader || normalizedHeader !== normalizedExpected) {
      console.error('❌ Unauthorized cron job attempt', {
        received: normalizedHeader,
        expected: normalizedExpected
      });
      return NextResponse.json(
        { error: 'Unauthorized', debug: { receivedHeader: normalizedHeader } },
        { status: 401 }
      );
    }

    console.log('⏰ Cron job triggered - processing queue directly...');

    // DIRECT PROCESSING - Instead of calling the API, we process directly
    try {
      console.log('🚀 Starting queue processing...');

      // 1. Claim queued jobs
      console.log('🔍 Attempting to claim lead_generation jobs...');
      const { data: jobs, error: claimError } = await supabaseAdmin.rpc('claim_queue', {
        p_type: 'lead_generation',
        p_limit: 3
      });

      console.log('📊 Claim result:', {
        jobsCount: jobs?.length || 0,
        jobs: jobs,
        claimError: claimError?.message || null
      });

      if (claimError) {
        console.error('❌ Error claiming jobs:', claimError);
        throw new Error(`Failed to claim jobs: ${claimError.message}`);
      }

      if (!jobs || jobs.length === 0) {
        console.log('📋 No lead_generation jobs to process');

        // Debug: Let's see what jobs exist
        const { data: allJobs } = await supabaseAdmin
          .from('processing_queue')
          .select('id, type, status, attempts, run_at')
          .eq('type', 'lead_generation');

        console.log('🔍 All lead_generation jobs in queue:', allJobs);

        return NextResponse.json({
          success: true,
          message: 'No lead_generation jobs to process',
          processed: 0,
          debug: { allJobs }
        });
      }

      console.log(`📋 Found ${jobs.length} lead_generation jobs to process`);
      let processed = 0;

      // 2. Process each job
      for (const job of jobs) {
        try {
          console.log(`🚀 Processing job ${job.id} (attempt ${job.attempts + 1}/${job.max_attempts})`);
          await processLeadGeneration(job);
          await markJobCompleted(job.id);
          processed++;
          console.log(`✅ Successfully processed job ${job.id}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Job ${job.id} failed:`, errorMessage);
          await markJobFailed(job.id, job.attempts, errorMessage);
        }
      }

      // 3. Process contact enrichment jobs
      await processContactEnrichmentJobs();

      // 4. Process email jobs
      await processEmailJobs();

      return NextResponse.json({
        success: true,
        message: `Cron job executed successfully - Processed ${processed} lead generation jobs`,
        processed
      });
    } catch (processingError: unknown) {
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      console.error('❌ Queue processing failed:', processingError);
      throw new Error(`Queue processing failed: ${errorMessage}`);
    }

  } catch (error: unknown) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}