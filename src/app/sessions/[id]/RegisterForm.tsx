"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  sessionId: string;
  sessionTitle: string;
  initialCounts: { confirmed_count: number; waitlist_count?: number };
  capacity: number;
  remainingCapacity: number;
  sessionMode?: "presentiel" | "distanciel" | null;
}

export default function RegisterForm({
  sessionId,
  sessionTitle,
  initialCounts,
  capacity,
  remainingCapacity,
  sessionMode,
}: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    commercial: "",
    technicalLevel: "",
    role: "",
  });
  const [msg, setMsg] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<any[]>([]);

  // Mise à jour temps réel des compteurs
  useEffect(() => {
    const channel = supabase
      .channel(`counter:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_counters",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setCounts(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

   // Récupération de l’historique
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("history") // 👈 pas activity_logs
        .select("*")
        .eq("session_id", sessionId) // 👈 filtre sur la session en cours
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error) setHistory(data || []);
    };

    fetchHistory();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("register_participant", {
        p_session: sessionId,
        p_email: formData.email,
        p_full_name: formData.fullName,
        p_company: formData.company || null,
        p_commercial: formData.commercial || null,
        p_technical_level: formData.technicalLevel || null,
        p_role: formData.role || null,
      });

      if (error) throw error;

      // Ici, tu récupères le status du participant
      const status = data?.[0]?.out_status as string | undefined;

      // Enregistrement dans l’historique (table history)
      await supabase.from("history").insert([
        {
          action: "inscription",
          commercial: formData.commercial,
          participant: formData.fullName,
          company: formData.company,
          session_id: sessionId,
          created_at: new Date(),
        },
      ]);

      if (status === "confirmed") {
        setMsg({
          type: "success",
          text: "Inscription confirmée avec succès !",
        });
      } else if (status === "waitlisted") {
        setMsg({ type: "info", text: "Ajouté à la liste d'attente" });
      } else {
        setMsg({ type: "info", text: "Inscription enregistrée" });
      }

      // Reset form
      setFormData({ fullName: "", email: "", company: "", commercial: "", technicalLevel: "",
  role: "", });
    } catch (error: any) {
      setMsg({ type: "error", text: "Erreur : " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const availableSpots =
  sessionMode === "presentiel"
    ? remainingCapacity
    : capacity - counts.confirmed_count;

const progressPercentage =
  (counts.confirmed_count / (sessionMode === "presentiel" ? 7 : capacity)) * 100;

  const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", " à");
};

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Inscription à la session
        </h2>
        <p className="text-gray-600 dark:text-slate-400">{sessionTitle}</p>
      </div>

      {/* Statut en temps réel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-slate-400">
            Progression des inscriptions
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {counts.confirmed_count}/{capacity} confirmés
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Formulaire */}
      <div onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              👤 Nom complet *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              ✉️ Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            🏢 Société
          </label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Nom de votre société"
          />
        </div>

        <div className="flex flex-col mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            🎯 Niveau technique
          </label>
          <select
            name="technicalLevel"
            required
            value={formData.technicalLevel}
            onChange={(e) =>
              setFormData({ ...formData, technicalLevel: e.target.value })
            }
            className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl 
                      text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      transition-all duration-200"
          >
            <option value="">Évaluer...</option>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        <div className="flex flex-col mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            💼 Poste / Fonction (optionnel)
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Sélectionner...</option>
            <option value="Développeur">Développeur</option>
            <option value="Tech Lead">Tech Lead</option>
            <option value="Architecte">Architecte</option>
            <option value="CTO/Directeur technique">CTO/Directeur technique</option>
            <option value="Manager">Manager</option>
            <option value="Consultant">Consultant</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div className="flex flex-col mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            👨‍💼 Commercial responsable
          </label>
            <select
              name="commercial"
              required
              value={formData.commercial}
              onChange={(e) => setFormData({ ...formData, commercial: e.target.value })} // 👈
              className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">-- Sélectionner un commercial --</option>
              <option value="Benoit Gilliocq">Benoit Gilliocq</option>
              <option value="Aurélie Michel">Aurélie Michel</option>
              <option value="Iréna Hamelin">Iréna Hamelin</option>
              <option value="Stéphane Genet">Stéphane Genet</option>
              <option value="Alexia Roy">Alexia Roy</option>
            </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
        >
          {loading ? "Inscription en cours..." : "Confirmer l'inscription"}
        </button>
      </div>

      {/* Messages de feedback */}
      {msg && (
        <div
          className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
            msg.type === "error"
              ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              : msg.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          }`}
        >
          <span className="text-lg">
            {msg.type === "success" ? "✅" : msg.type === "error" ? "⚠️" : "ℹ️"}
          </span>
          <span className="font-medium">{msg.text}</span>
        </div>
      )}

      {/* Historique des actions */}
      {history.length > 0 && (
        <div className="mt-8 bg-blue-50 dark:bg-slate-700/30 border border-blue-200 dark:border-slate-600 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Historique récent
          </h3>
          <ul className="space-y-3">
            {history.map((h) => (
              <li
                key={h.id}
                className="text-sm text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-600 pb-2 last:border-0"
              >
                <span className="font-semibold">
                  {formatDateTime(h.created_at)}
                </span>{" "}
                - {h.commercial} a inscrit {h.participant} ({h.company}) • Session{" "}
                {h.session_id}

              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
