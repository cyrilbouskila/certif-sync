"use client";

export default function HistoryList({ history }: { history: any[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-gray-500 text-sm mt-4">
        Aucun historique pour cette session.
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gray-50 dark:bg-slate-800 border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Historique de la session</h3>
      <ul className="space-y-2">
        {history.map((h) => (
          <li key={h.id} className="text-sm text-gray-700 dark:text-slate-300">
            <span className="font-medium">
              {new Date(h.created_at).toLocaleString("fr-FR")}
            </span>{" "}
            — {h.action}
            {h.user_id && (
              <span className="text-gray-500"> (par {h.user_id})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
