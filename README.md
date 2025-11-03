# LeadApp MVP

A complete lead generation system with automated email workflows.

## 🚀 **Features**

- **Lead Form Submission** - Capture lead information
- **Newsletter Signup** - Email list building
- **PDF Request** - Lead magnet downloads
- **Automated Email System** - Welcome emails with Resend
- **Queue Processing** - Background job processing
- **Database Triggers** - Automatic workflow triggers
- **Contact Enrichment** - AI-powered contact discovery

## 📁 **Project Structure**

```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
│   ├── supabase.ts        # Supabase client
│   └── contact-enrichment.ts # Contact finding with AI
├── sql/                    # Database files (organized)
│   ├── migrations/         # Database schema migrations
│   ├── functions/          # Standalone SQL functions
│   ├── testing/            # Testing scripts
│   ├── debug/              # Debugging scripts
│   └── archive/            # Old/unused files
├── supabase/              # Supabase configuration
│   └── functions/         # Edge Functions
├── docs/                  # Documentation
│   ├── setup/             # Setup guides
│   ├── features/          # Feature documentation
│   └── deployment/        # Deployment guides
```

## 🛠️ **Setup**

1. **Database Setup**: Run `sql/migrations/supabase-schema.sql`
2. **Contact Enrichment**: Run `sql/migrations/enhance-company-contacts-simple.sql`
3. **Email Setup**: Follow `docs/setup/EMAIL_SETUP_GUIDE.md`
4. **Environment Variables**: Set up Supabase, OpenAI, and Resend keys

## 🧪 **Testing**

- **Test Forms**: Use `sql/testing/test-all-form-types.sql`
- **Debug Issues**: Use `sql/debug/simple-debug.sql`
- **Clean Test Data**: Use `sql/testing/delete-test-entries.sql`

## 📧 **Email System**

- **Resend Integration** - Professional email sending
- **HTML Templates** - Beautiful email designs
- **Queue Processing** - Automated background processing
- **Multiple Form Types** - Newsletter, PDF, Lead forms
- **Contact Discovery** - AI-powered contact finding

## 🔧 **Tech Stack**

- **Next.js** - React framework
- **Supabase** - Database and Edge Functions
- **Resend** - Email service
- **PostgreSQL** - Database with triggers
- **TypeScript** - Type safety
- **OpenAI API** - AI-powered contact discovery

## 📋 **Quick Start**

1. Set up database with `sql/migrations/supabase-schema.sql`
2. Set up contact enrichment with `sql/migrations/enhance-company-contacts-simple.sql`
3. Configure email with `docs/setup/EMAIL_SETUP_GUIDE.md`
4. Set OpenAI API key in environment variables
5. Test with `sql/testing/test-all-form-types.sql`
6. Deploy and enjoy! 🎉

## 🎯 **Current Status**

✅ **Complete System Working:**
- All form types (leads, newsletter, PDF) working
- Email system sending real emails via Resend
- Queue processing automated every 5 minutes
- Database triggers firing correctly
- Professional HTML email templates
- AI-powered contact discovery for leads
- Multiple contacts per company with tracking

## 📞 **Support**

For questions or issues, contact:
- Email: oliverscott14@gmail.com

---

**LeadApp MVP** - Built with ❤️ using Next.js, TypeScript, Supabase, and Resend