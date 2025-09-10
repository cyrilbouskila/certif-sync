"use client";

interface HistoryItem {
  id: string;
  created_at: string;
  action: string;
  user_id?: string | null;
}

interface Props {
  history: HistoryItem[];
}

export default function HistoryList({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="text-gray-500 dark:text-slate-400 text-sm mt-4 italic">
        Aucun historique pour cette session.
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        📋 Historique de la session
      </h3>
      <ul className="space-y-2">
        {history.map((h) => {
          const dateFormatted = new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(h.created_at));

          return (
            <li
              key={h.id}
              className="text-sm text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 pb-2 last:border-0"
            >
              <span className="font-medium">{dateFormatted}</span> — {h.action}
              {h.user_id && (
                <span className="text-gray-500 dark:text-slate-400">
                  {" "}
                  (par {h.user_id})
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
