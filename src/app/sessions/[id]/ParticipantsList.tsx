"use client";

import { useState } from "react";

interface Participant {
  id: string;
  full_name: string;
  email: string;
  company?: string | null;
}

interface Props {
  participants: Participant[];
}

export default function ParticipantsList({ participants }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      {/* Bouton toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
      >
        👥 Voir les inscrits ({participants.length})
        <span
          className={`transform transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Liste des participants */}
      {open && (
        <ul className="mt-3 space-y-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          {participants.length > 0 ? (
            participants.map((p) => (
              <li
                key={p.id}
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                <span className="font-semibold">{p.full_name}</span>{" "}
                ({p.company || "—"}) • {p.email}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500 dark:text-slate-400 italic">
              Aucun participant inscrit pour le moment
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
