import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomerData {
  id: string
  email: string
  signup_type: 'leads' | 'newsletter' | 'pdf'
  created_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { customer_id, email, signup_type } = await req.json()

    if (!customer_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customer_id and email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing welcome email for customer: ${customer_id}, email: ${email}, type: ${signup_type}`)

    // Generate PDF content (placeholder for now)
    const pdfContent = await generateWelcomePDF(email, signup_type)

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email, signup_type, pdfContent)

    if (emailResult.success) {
      // Update customer record to mark email as sent
      const { error: updateError } = await supabaseClient
        .from('customers')
        .update({
          updated_at: new Date().toISOString(),
          // Add a field to track email status if needed
        })
        .eq('id', customer_id)

      if (updateError) {
        console.error('Error updating customer record:', updateError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Welcome email sent successfully',
          customer_id,
          email
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error(emailResult.error || 'Failed to send email')
    }

  } catch (error) {
    console.error('Error in newsletter-welcome function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateWelcomePDF(email: string, signupType: string): Promise<string> {
  // Placeholder PDF generation
  // In production, you would use a PDF library like Puppeteer or PDFKit
  console.log(`Generating welcome PDF for ${email} with signup type: ${signupType}`)

  // For now, return a placeholder
  return `Welcome PDF for ${email} - ${signupType} signup`
}

async function sendWelcomeEmail(email: string, signupType: string, pdfContent: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set for Edge Function')
    }

    const emailTemplate = getEmailTemplate(signupType)

    const subject = signupType === 'pdf'
      ? 'Your PDF guide is ready'
      : 'Thanks for subscribing!'

    const text = signupType === 'pdf'
      ? `Thanks for signing up! Here's your guide:\n\n${pdfContent}\n\n— LeadApp`
      : `Thanks for subscribing! You're on the list.\n\n— LeadApp`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'LeadApp <noreply@designsmidwestsales.com>',
        to: [email],
        subject,
        text,
        html: emailTemplate
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend failed: ${res.status} ${errText}`)
    }

    const body = await res.json()
    console.log('Welcome email sent:', body.id)
    return { success: true, messageId: body.id as string }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: (error as Error).message }
  }
}

function getEmailTemplate(signupType: string): string {
  const templates = {
    newsletter: `
      <h1>Welcome to LeadApp Newsletter!</h1>
      <p>Thank you for subscribing to our newsletter. You'll receive valuable insights and updates about lead generation.</p>
      <p>As a welcome gift, here's your free PDF guide to get you started!</p>
      <p>Best regards,<br>The LeadApp Team</p>
    `,
    pdf: `
      <h1>Thanks for Your Interest!</h1>
      <p>Thank you for requesting our free PDF guide. Here's your download!</p>
      <p>This guide contains valuable strategies for lead generation that you can implement right away.</p>
      <p>Best regards,<br>The LeadApp Team</p>
    `,
    leads: `
      <h1>Welcome to LeadApp!</h1>
      <p>Thank you for signing up for our lead generation service. We're excited to help you grow your business!</p>
      <p>Here's your welcome package with everything you need to get started.</p>
      <p>Our team will be in touch soon to discuss your specific needs.</p>
      <p>Best regards,<br>The LeadApp Team</p>
    `
  }

  return templates[signupType] || templates.newsletter
}
