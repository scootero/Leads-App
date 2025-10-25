import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formType, email, ...formData } = body;

    console.log('Form submission received:', { formType, email, formData });
    console.log('Full request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!email || !formType) {
      return NextResponse.json(
        { error: 'Email and form type are required' },
        { status: 400 }
      );
    }

    let customerId: string;
    let result: any;

    // Handle different form types
    switch (formType) {
      case 'leads':
        // Lead form submission
        const { ref_company, industry, region, keywords, mode, mode_id } = formData;

        if (!ref_company || !mode || !mode_id) {
          return NextResponse.json(
            { error: 'Company name, mode, and mode_id are required for lead submissions' },
            { status: 400 }
          );
        }

        // First, create or get customer record
        const { data: existingCustomer } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('email', email)
          .eq('signup_type', 'leads')
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer record
          const { data: newCustomer, error: customerError } = await supabaseAdmin
            .from('customers')
            .insert({
              email,
              signup_type: 'leads'
            })
            .select('id')
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }

        // Create lead submission record
        const { data: leadSubmission, error: leadError } = await supabaseAdmin
          .from('lead_submissions')
          .insert({
            customer_id: customerId,
            ref_company,
            industry: industry || null,
            region: region || null,
            keywords: keywords || null,
            mode,
            mode_id
          })
          .select('id')
          .single();

        if (leadError) throw leadError;

        result = {
          customerId,
          leadSubmissionId: leadSubmission.id,
          message: 'Lead submission saved successfully'
        };
        break;

      case 'newsletter':
        // Newsletter signup
        const { data: newsletterCustomer, error: newsletterError } = await supabaseAdmin
          .from('customers')
          .insert({
            email,
            signup_type: 'newsletter'
          })
          .select('id')
          .single();

        if (newsletterError) {
          // If email already exists, that's okay - they'll still get the welcome email
          if (newsletterError.code === '23505') {
            const { data: existingNewsletter } = await supabaseAdmin
              .from('customers')
              .select('id')
              .eq('email', email)
              .eq('signup_type', 'newsletter')
              .single();

            result = {
              customerId: existingNewsletter?.id,
              message: 'Newsletter signup successful (already subscribed)'
            };
          } else {
            throw newsletterError;
          }
        } else {
          result = {
            customerId: newsletterCustomer.id,
            message: 'Newsletter signup successful'
          };
        }
        break;

      case 'pdf':
        // PDF request
        const { data: pdfCustomer, error: pdfError } = await supabaseAdmin
          .from('customers')
          .insert({
            email,
            signup_type: 'pdf'
          })
          .select('id')
          .single();

        if (pdfError) {
          // If email already exists, that's okay
          if (pdfError.code === '23505') {
            const { data: existingPdf } = await supabaseAdmin
              .from('customers')
              .select('id')
              .eq('email', email)
              .eq('signup_type', 'pdf')
              .single();

            result = {
              customerId: existingPdf?.id,
              message: 'PDF request successful (already requested)'
            };
          } else {
            throw pdfError;
          }
        } else {
          result = {
            customerId: pdfCustomer.id,
            message: 'PDF request successful'
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid form type. Must be: leads, newsletter, or pdf' },
          { status: 400 }
        );
    }

    console.log('Form submission successful:', result);
    console.log('✅ Successfully processed formType:', formType, 'for email:', email);

    return NextResponse.json({
      success: true,
      ...result
    }, { status: 200 });

  } catch (error: any) {
    console.error('Form submission error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });

    return NextResponse.json(
      {
        error: 'Failed to save form submission',
        details: error.message,
        code: error.code,
        hint: error.hint
      },
      { status: 500 }
    );
  }
}
