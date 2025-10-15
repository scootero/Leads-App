# LeadSpark MVP Landing Page

A minimal MVP landing page for LeadSpark - a SaaS platform that connects suppliers with buyers to generate qualified leads.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd leadspark-mvp
   npm install
   ```

2. **Set up Formspree (for form submissions):**
   - Go to [Formspree.io](https://formspree.io/)
   - Create a new form
   - Copy the form endpoint URL
   - Update `.env.local` with your Formspree endpoint:
     ```
     FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
     ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
leadspark-mvp/
├── app/
│   ├── api/submit/route.ts     # Placeholder API route (future use)
│   ├── leads/page.tsx          # Main landing page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Redirects to /leads
├── components/
│   └── LeadSparkClassicToggle.tsx  # Main form component
├── .env.local                  # Environment variables
└── package.json
```

## 🎯 Features

- **Dual Mode Form**: General Leads and Supplier ↔ Buyer tabs
- **Responsive Design**: Mobile-first with TailwindCSS
- **Form Validation**: Client-side validation for required fields
- **Email Integration**: Formspree integration for lead collection
- **TypeScript**: Full type safety
- **Vercel Ready**: Optimized for Vercel deployment

## 📧 Form Submission

The form currently uses Formspree for email delivery. Submissions are sent to:
- `oliverscott14@gmail.com`
- `scott@designmidwestsales.com`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial LeadSpark MVP"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel dashboard:
     - `FORMSPREE_ENDPOINT`
     - `NEXT_PUBLIC_EMAIL_TO`

3. **Your site will be live at:** `https://your-project.vercel.app`

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:
```env
FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
NEXT_PUBLIC_EMAIL_TO=oliverscott14@gmail.com,scott@designmidwestsales.com
```

### Formspree Setup

1. Visit [Formspree.io](https://formspree.io/)
2. Create account and new form
3. Get your form endpoint URL
4. Update `FORMSPREE_ENDPOINT` in `.env.local`

## 🎨 Customization

### Styling
- Uses TailwindCSS with slate/neutral color palette
- Responsive design with mobile-first approach
- Custom styling in `components/LeadSparkClassicToggle.tsx`

### Form Fields
- Modify form fields in `LeadSparkClassicToggle.tsx`
- Add validation rules as needed
- Update TypeScript interfaces for type safety

## 🔮 Future Enhancements

This MVP is designed for manual lead validation. Future phases will include:

- **Phase 2**: Replace Formspree with Resend API
- **Phase 3**: Add Supabase database integration
- **Phase 4**: Implement lead enrichment with OpenAI API
- **Phase 5**: Add background workers for "20 similar companies" feature

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Deployment**: Vercel
- **Form Handling**: Formspree (MVP), Resend (future)

## 📞 Support

For questions or issues, contact:
- Email: oliverscott14@gmail.com
- Email: scott@designmidwestsales.com

---

**LeadSpark MVP** - Built with ❤️ using Next.js, TypeScript, and TailwindCSS