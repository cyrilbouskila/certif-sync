"use client";

import { useState } from "react";

export default function ParticipantsList({ participants }: { participants: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
        >
        👥 Voir les inscrits ({participants.length})
        <span className={`transform transition-transform ${open ? "rotate-180" : ""}`}>
            ▼
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-2 bg-white dark:bg-slate-800 border rounded-lg p-4">
          {participants.map((p) => (
            <li key={p.id} className="text-sm text-gray-700 dark:text-slate-300">
              <span className="font-semibold">{p.full_name}</span>{" "}
              ({p.company || "—"}) - {p.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
