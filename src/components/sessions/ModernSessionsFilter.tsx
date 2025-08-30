"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  type: "server-side" | "global";
  mode?: "presentiel" | "distanciel" | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  location: string | null;
  confirmed_count: number;
};

export default function ModernSessionsFilter({
  sessions,
}: {
  sessions: Session[];
}) {
  const [typeFilter, setTypeFilter] = useState<
    "all" | "server-side" | "global"
  >("all");
  const [modeFilter, setModeFilter] = useState<
    "all" | "presentiel" | "distanciel"
  >("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
  return sessions
    .filter((s) => (typeFilter === "all" ? true : s.type === typeFilter))
    .filter((s) =>
      modeFilter === "all" ? true : (s.mode ?? "presentiel") === modeFilter
    )
    .filter((s) => {
      if (!query.trim()) return true;
      const hay = `${s.title} ${s.location ?? ""}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        : new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    );
}, [sessions, typeFilter, modeFilter, query, sortOrder]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Capacité globale max pour le présentiel (salle)
const GLOBAL_CAPACITY = 7;

const getRemainingCapacity = (session: Session) => {
  if (session.mode !== "presentiel") {
    // pour le distanciel, on garde la logique normale
    return session.capacity - session.confirmed_count;
  }

  // Filtrer toutes les sessions du même mois et en présentiel
  const start = new Date(session.starts_at);
  const month = start.getMonth();
  const year = start.getFullYear();

  const sameMonthSessions = sessions.filter((s) => {
    if (s.mode !== "presentiel") return false;
    const d = new Date(s.starts_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Nombre total d'inscrits dans le mois
  const totalConfirmed = sameMonthSessions.reduce(
    (sum, s) => sum + s.confirmed_count,
    0
  );

  // Reste global pour la salle
  return Math.max(GLOBAL_CAPACITY - totalConfirmed, 0);
};

// Vérifie si une session est confirmée (>= 4 inscrits cumulés dans le mois présentiel)
const isSessionConfirmed = (session: Session) => {
  if (session.mode !== "presentiel") return false;

  const start = new Date(session.starts_at);
  const month = start.getMonth();
  const year = start.getFullYear();

  // Sessions du même mois en présentiel
  const sameMonthSessions = sessions.filter((s) => {
    if (s.mode !== "presentiel") return false;
    const d = new Date(s.starts_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Total des inscrits cumulés
  const totalConfirmed = sameMonthSessions.reduce(
    (sum, s) => sum + s.confirmed_count,
    0
  );

  return totalConfirmed >= 4;
};

  return (
    <div className="space-y-8">
      {/* Barre de filtres moderne */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Rechercher par titre ou lieu..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-48"
            >
              <option value="all">Tous les types</option>
              <option value="server-side">Server-Side</option>
              <option value="global">Global</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-48"
            >
              <option value="all">Tous les modes</option>
              <option value="presentiel">Présentiel</option>
              <option value="distanciel">Distanciel</option>
            </select>

          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sessions disponibles{" "}
            <span className="text-lg font-medium text-gray-500 dark:text-slate-400">
              ({filtered.length} session{filtered.length > 1 ? "s" : ""})
            </span>
          </h2>

          {/* Sélecteur de tri */}
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
      className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
    >
      <option value="asc">📅 Date croissante</option>
      <option value="desc">📅 Date décroissante</option>
    </select>

        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-6">
            {filtered.map((session) => {
              const availableSpots = getRemainingCapacity(session);
              const effectiveCapacity =
                session.mode === "presentiel" ? GLOBAL_CAPACITY : session.capacity;
              const progressPercentage =
                (session.confirmed_count / effectiveCapacity) * 100;

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className={`block rounded-2xl p-6 shadow-sm hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-slate-800/50 
                    transition-all duration-300 group cursor-pointer border
                    ${session.type === "server-side"
                      ? "bg-[#ECF3F6] border-[#ECF3F6] dark:bg-blue-900/40 dark:border-[#ECF3F6]"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    }
                    hover:border-[#145AF9]`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-700 transition-colors">
                        {session.title}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                            session.type === "server-side"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                              : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                          }`}
                        >
                          {session.type === "server-side"
                            ? "Server-Side"
                            : "Global"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                          {session.mode === "distanciel"
                            ? "🌐 Distanciel"
                            : "🏢 Présentiel"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">📅</span>
                          <span>{formatDate(session.starts_at)}
                            {session.ends_at && (<> → {formatDate(session.ends_at)}</>
                          )}
                          </span>
                        </div>
                        {session.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">
                              {session.mode === "distanciel" && session.location === "Microsoft Teams"
                                ? "🖥️"
                                : "📍"}
                            </span>
                            <span>{session.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">👥</span>
                          <span>
                            {session.mode === "presentiel" 
                              ? `${session.confirmed_count}/7 inscrits` 
                              : `${session.confirmed_count}/${session.capacity} inscrits`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className="mb-3">
                        {availableSpots > 0 ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                              ${availableSpots === 1
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : availableSpots <= 2
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}
                          >
                            {availableSpots === 1
                              ? "⚠️ 1 place restante"
                              : `✅ ${availableSpots} places restantes`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-300 text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                            ❌ Complet
                          </span>
                        )}
                      </div>
                      {availableSpots > 0 ? (
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium">
                          S'inscrire →
                        </span>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-full font-medium">
                          ❌ Session complète
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Infos supplémentaires */}
                    <div className="mt-4 text-sm">
                      {/* Date limite d'inscription (J-7) */}
                      {(() => {
                        const start = new Date(session.starts_at);
                        const deadline = new Date(start);
                        deadline.setDate(start.getDate() - 7);

                        const formattedDeadline = new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }).format(deadline);

                        const diffTime = deadline.getTime() - Date.now();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        return (
                          <p className="text-gray-600 dark:text-slate-400">
                            📅 Inscription jusqu’au <b>{formattedDeadline}</b>{" "}
                            ({diffDays >= 0 ? `J-${diffDays}` : "clôturé"})
                          </p>
                        );
                      })()}

                      {/* Statut de confirmation */}
                      {isSessionConfirmed(session) ? (
                        <p className="text-green-600 dark:text-green-400 font-medium mt-1">
                          ✅ Session confirmée : minimum de 4 participants atteints
                        </p>
                      ) : (
                        <p className="text-gray-500 dark:text-slate-400 mt-1">
                          ⏳ En attente de confirmation (minimum 4 participants requis)
                        </p>
                      )}
                    </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-4">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        session.type === "server-side"
                          ? "bg-gradient-to-r from-blue-500 to-blue-700"
                          : "bg-gradient-to-r from-green-500 to-green-700"
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </Link> 
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block opacity-20">🔍</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucune session trouvée
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
