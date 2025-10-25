# LeadApp MVP

A complete lead generation system with automated email workflows.

## 🚀 **Features**

- **Lead Form Submission** - Capture lead information
- **Newsletter Signup** - Email list building
- **PDF Request** - Lead magnet downloads
- **Automated Email System** - Welcome emails with Resend
- **Queue Processing** - Background job processing
- **Database Triggers** - Automatic workflow triggers

## 📁 **Project Structure**

```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
├── sql/                    # Database files (organized)
│   ├── setup/             # Database setup scripts
│   ├── testing/           # Testing scripts
│   ├── debug/             # Debugging scripts
│   └── archive/           # Old/unused files
├── supabase/              # Supabase configuration
│   └── functions/         # Edge Functions
└── EMAIL_SETUP_GUIDE.md   # Email setup instructions
```

## 🛠️ **Setup**

1. **Database Setup**: Run `sql/setup/create-queue-system.sql`
2. **Email Setup**: Follow `EMAIL_SETUP_GUIDE.md`
3. **Environment Variables**: Set up Supabase and Resend keys

## 🧪 **Testing**

- **Test Forms**: Use `sql/testing/test-all-form-types.sql`
- **Debug Issues**: Use `sql/debug/simple-debug.sql`
- **Clean Test Data**: Use `sql/testing/delete-test-entries.sql`

## 📧 **Email System**

- **Resend Integration** - Professional email sending
- **HTML Templates** - Beautiful email designs
- **Queue Processing** - Automated background processing
- **Multiple Form Types** - Newsletter, PDF, Lead forms

## 🔧 **Tech Stack**

- **Next.js** - React framework
- **Supabase** - Database and Edge Functions
- **Resend** - Email service
- **PostgreSQL** - Database with triggers
- **TypeScript** - Type safety

## 📋 **Quick Start**

1. Set up database with `sql/setup/create-queue-system.sql`
2. Configure email with `EMAIL_SETUP_GUIDE.md`
3. Test with `sql/testing/test-all-form-types.sql`
4. Deploy and enjoy! 🎉

## 🎯 **Current Status**

✅ **Complete System Working:**
- All form types (leads, newsletter, PDF) working
- Email system sending real emails via Resend
- Queue processing automated every 5 minutes
- Database triggers firing correctly
- Professional HTML email templates

## 📞 **Support**

For questions or issues, contact:
- Email: oliverscott14@gmail.com

---

**LeadApp MVP** - Built with ❤️ using Next.js, TypeScript, Supabase, and Resend