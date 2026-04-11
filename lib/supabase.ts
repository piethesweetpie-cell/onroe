import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://vfzateaxdsqokcujqnjt.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmemF0ZWF4ZHNxb2tjdWpxbmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTUxOTAsImV4cCI6MjA5MDUzMTE5MH0.JSjiuR8H7li67vwFI1-mTx9gNvKOQSLsi7j1-rQOdyA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
