const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Se queste sono vuote sul sito live, l'errore è qui
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variabili mancanti!");
}