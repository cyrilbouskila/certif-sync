// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// On initialise le client Supabase avec les variables d'environnement
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
