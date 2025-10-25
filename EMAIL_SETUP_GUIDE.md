# Email Setup Guide - Resend Integration

## 🚀 **Quick Setup for Real Email Sending**

Your Edge Functions are now configured to send real emails using Resend. Here's how to set it up:

### **Step 1: Sign Up for Resend**
1. Go to [resend.com](https://resend.com)
2. Create a free account (100 emails/day free)
3. Verify your email address

### **Step 2: Get Your API Key**
1. Go to **API Keys** in your Resend dashboard
2. Click **Create API Key**
3. Name it: `LeadApp Production`
4. Copy the API key (starts with `re_`)

### **Step 3: Add API Key to Supabase**
1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Settings**
3. Add environment variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_api_key_here`

### **Step 4: Update Email Domain (Optional)**
In the Edge Function code, update the `from` field:
```typescript
from: 'LeadApp <noreply@yourdomain.com>'
```

### **Step 5: Redeploy Edge Function**
1. Go to **Edge Functions** → **queue-processor**
2. Click **Deploy** to update with new email code

## 📧 **What Happens Now:**

- **Newsletter signups** → Get welcome email with newsletter template
- **PDF requests** → Get welcome email with PDF template
- **Lead submissions** → Get welcome email with leads template
- **All emails** → Professional HTML templates with your branding

## 🧪 **Test the Email System:**

1. **Submit a test form** on your website
2. **Check Edge Function logs** for email sending activity
3. **Check your email** for the welcome message
4. **Check Resend dashboard** for delivery status

## 📋 **Email Templates Included:**

- ✅ **Newsletter Welcome** - Professional newsletter signup email
- ✅ **PDF Request** - Free guide download email
- ✅ **Lead Welcome** - Business lead generation email
- ✅ **HTML + Text** - Both formats for better deliverability

## 🔧 **Troubleshooting:**

### **If emails aren't sending:**
1. Check **RESEND_API_KEY** is set correctly
2. Check **Edge Function logs** for errors
3. Check **Resend dashboard** for API usage
4. Verify **email address** is valid

### **If emails go to spam:**
1. Add **SPF/DKIM records** for your domain
2. Use a **verified domain** in Resend
3. Avoid spam trigger words

## 🎯 **Next Steps:**

1. **Set up Resend** (5 minutes)
2. **Add API key** to Supabase
3. **Redeploy Edge Function**
4. **Test with real form submission**
5. **Check your email!**

**Once set up, all your form submissions will automatically send professional welcome emails!** 🚀
