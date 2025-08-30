import { supabase } from "@/lib/supabaseClient";
import RegisterForm from "./RegisterForm";
import Link from "next/link";
import ParticipantsList from "./ParticipantsList";
import HistoryList from "./HistoryList";

type Props = { params: { id: string } };

export default async function SessionPage({ params }: Props) {
  const id = await params.id;

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id,title,type,mode,starts_at,ends_at,capacity,location,session_counters (confirmed_count)")
    .eq("id", id)
    .single();

    if (!session) {
  throw new Error("Session not found");
}

let remainingCapacity = session.capacity; // Maintenant TypeScript sait que session n'est pas null

  const { data: participants } = await supabase
    .from("participants")
    .select("id, full_name, company, email")
    .eq("session_id", id);

  const { data: history, error: historyError } = await supabase
  .from("history")
  .select("id, action, created_at, user_id")
  .eq("session_id", id)
  .order("created_at", { ascending: false });

    remainingCapacity = session.capacity;

  if (session.mode === "presentiel") {
    const start = new Date(session.starts_at);
    const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    // Récupérer toutes les inscriptions du mois en présentiel
    const { data: monthlyRegistrations } = await supabase
      .from("participants")
      .select("id, session_id, sessions!inner(starts_at, mode)")
      .eq("sessions.mode", "presentiel")
      .gte("sessions.starts_at", firstDayOfMonth.toISOString())
      .lte("sessions.starts_at", lastDayOfMonth.toISOString());

    const totalMois = monthlyRegistrations?.length ?? 0;

    // Capacité max absolue (7)
    const globalCapacite = 7;

    // Capacité restante pour CETTE session
    remainingCapacity = Math.max(globalCapacite - totalMois, 0);
  }

  let sessionConfirmed = false;

if (session.mode === "presentiel") {
  const start = new Date(session.starts_at);
  const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);

  const { data: sameMonthSessions } = await supabase
    .from("sessions")
    .select("id, session_counters(confirmed_count), mode, starts_at")
    .eq("mode", "presentiel")
    .gte("starts_at", firstDayOfMonth.toISOString())
    .lte("starts_at", lastDayOfMonth.toISOString());

  const totalConfirmed =
    sameMonthSessions?.reduce(
      (sum, s) => sum + (s.session_counters?.[0]?.confirmed_count ?? 0),
      0
    ) ?? 0;

  sessionConfirmed = totalConfirmed >= 4;
}

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center shadow-sm">
          <div className="text-red-500 text-lg font-semibold mb-2">
            ⚠️ Session introuvable
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-medium transition-all duration-200 mt-4"
          >
            ← Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

const confirmed = participants?.length ?? 0;

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        ← Retour aux sessions
      </Link>

      {/* En-tête de la session */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {session.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                session.type === "server-side"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                  : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
              }`}
            >
              {session.type === "server-side" ? "Server-Side" : "Global"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
              {session.mode === "distanciel"
                ? "🌐 Distanciel"
                : "🏢 Présentiel"}
            </span>
          </div>
        </div>

        {/* Informations de la session */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 text-lg">📅</span>
            <div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Début
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(session.starts_at)}
              </div>
            </div>
          </div>

          {session.location && (
            <div className="flex items-center gap-3">
              <span className="text-blue-600 text-lg">
                {session.location.toLowerCase().includes("microsoft teams") ? "🖥️" : "📍"}
              </span>
              <div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Lieu
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {session.location}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-blue-600 text-lg">👥</span>
            <div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Capacité</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {session.mode === "presentiel" 
              ? `${confirmed}/7` 
              : `${confirmed}/${session.capacity}`}
              </div>
            </div>

            {/* Espace extensible */}
            <div className="flex-1"></div>

            {/* Bouton complètement à droite */}
            <div className="flex items-center justify-end gap-3">
            <ParticipantsList participants={participants ?? []} />
          </div>
                    </div>
                  </div>
                </div>

      {/* Formulaire d'inscription */}
      <RegisterForm
        sessionId={session.id}
        sessionTitle={session.title}
        initialCounts={{ confirmed_count: confirmed }}
        capacity={session.mode === "presentiel" ? 7 : session.capacity}
        remainingCapacity={remainingCapacity}
        sessionMode={session.mode}
      />
      {/* Historique de la session */}
      <HistoryList history={history ?? []} />
    </div>
  );
}