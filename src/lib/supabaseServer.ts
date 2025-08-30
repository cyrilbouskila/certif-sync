import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // ton URL Supabase
  process.env.SUPABASE_SERVICE_ROLE!     // ⚠️ clé secrète, jamais côté client
);
