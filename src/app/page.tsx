import ModernSessionsFilter from "@/components/sessions/ModernSessionsFilter";
import { supabase } from "@/lib/supabaseClient";

export default async function Page() {
  const { data: sessions, error } = await supabase
    .from("sessions_with_counts")
    .select("*")
    .order("starts_at");

  if (error) {
    return (
      <main className="p-6 text-red-600">❌ Erreur : {error.message}</main>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Sessions de certification
        </h1>
        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Découvrez nos formations certifiantes et inscrivez-vous facilement
        </p>
      </div>

      <ModernSessionsFilter sessions={sessions ?? []} />
    </div>
  );
}
