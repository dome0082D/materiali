import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Creiamo il client anche se le stringhe sono vuote (evita il crash del build)
// Il controllo vero lo faremo solo quando serve davvero
export const supabase = createClient(supabaseUrl, supabaseAnonKey)