import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ATTENZIONE: Chiavi Supabase mancanti nel file .env.local!")
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
)