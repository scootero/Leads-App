import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzhfvzzhrpqngvuxxdgs.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGZ2enpocnBxbmd2dXh4ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTkzNjYsImV4cCI6MjA3NjYzNTM2Nn0.78q-ySxVw11eYqqrtDXOHgM7RsJPD1QFpTM24BPUrto'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aGZ2enpocnBxbmd2dXh4ZGdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1OTM2NiwiZXhwIjoyMDc2NjM1MzY2fQ.rZByAsg1LMgkv_XrYAQUD8YqSk9Pfc9lLu7ZM8xTJ8E'
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
