import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Email templates for newsletter and PDF signups
const getEmailTemplate = (signupType: 'newsletter' | 'pdf'): { subject: string; text: string; html: string } => {
  const templates = {
    newsletter: {
      subject: 'Thanks for subscribing!',
      text: `Thanks for subscribing! You're on the list.\n\n— LeadApp`,
      html: `
        <h1>Welcome to LeadApp Newsletter!</h1>
        <p>Thank you for subscribing to our newsletter. You'll receive valuable insights and updates about lead generation.</p>
        <p>As a welcome gift, here's your free PDF guide to get you started!</p>
        <p>Best regards,<br>The LeadApp Team</p>
      `
    },
    pdf: {
      subject: 'Your PDF guide is ready',
      text: `Thanks for signing up! Here's your guide.\n\n— LeadApp`,
      html: `
        <h1>Thanks for Your Interest!</h1>
        <p>Thank you for requesting our free PDF guide. Here's your download!</p>
        <p>This guide contains valuable strategies for lead generation that you can implement right away.</p>
        <p>Best regards,<br>The LeadApp Team</p>
      `
    }
  };

  return templates[signupType];
};

// Send welcome email directly using Resend
async function sendWelcomeEmail(email: string, signupType: 'newsletter' | 'pdf') {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable not set');
    }

    const template = getEmailTemplate(signupType);

    console.log(`📧 Sending ${signupType} welcome email to: ${email}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LeadApp <noreply@designsmidwestsales.com>',
        to: [email],
        subject: template.subject,
        text: template.text,
        html: template.html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Welcome email sent successfully:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't fail the request if email fails
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

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
    let result: { success: boolean; message: string; data?: unknown; customerId?: string; leadSubmissionId?: string };

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
           success: true,
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
              success: true,
            customerId: existingNewsletter?.id,
            message: 'Newsletter signup successful (already subscribed)'
          };

          // Send welcome email even if already subscribed
          await sendWelcomeEmail(email, 'newsletter');
          } else {
            throw newsletterError;
          }
        } else {
          result = {
            success: true,
          customerId: newsletterCustomer.id,
          message: 'Newsletter signup successful'
        };

        // Send welcome email directly
        await sendWelcomeEmail(email, 'newsletter');
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
              success: true,
            customerId: existingPdf?.id,
            message: 'PDF request successful (already requested)'
          };

          // Send welcome email even if already requested
          await sendWelcomeEmail(email, 'pdf');
          } else {
            throw pdfError;
          }
        } else {
          result = {
            success: true,
          customerId: pdfCustomer.id,
          message: 'PDF request successful'
        };

        // Send welcome email directly
        await sendWelcomeEmail(email, 'pdf');
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

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
    const errorDetails = error && typeof error === 'object' && 'details' in error ? (error as { details: string }).details : undefined;
    const errorHint = error && typeof error === 'object' && 'hint' in error ? (error as { hint: string }).hint : undefined;
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Form submission error:', {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      hint: errorHint,
      stack: errorStack
    });

    return NextResponse.json(
      {
        error: 'Failed to save form submission',
        details: errorMessage,
        code: errorCode,
        hint: errorHint
      },
      { status: 500 }
    );
  }
}
