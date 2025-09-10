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

interface HistoryItem {
  id: string;
  action: string;
  commercial: string | null;
  participant: string;
  company: string | null;
  session_id: string;
  created_at: string;
}

interface Counter {
  confirmed_count: number;
  waitlist_count?: number;
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
  const [counts, setCounts] = useState<Counter>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 🔄 Mise à jour temps réel des compteurs
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
        (payload: { new: Counter }) => {
          setCounts(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // 📜 Récupération de l’historique
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) setHistory(data as HistoryItem[]);
    };

    fetchHistory();
  }, [sessionId]);

  // 📝 Soumission formulaire
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

      const status = data?.[0]?.out_status as string | undefined;

      // 👉 Ajout à l’historique
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
        setMsg({ type: "success", text: "Inscription confirmée avec succès !" });
      } else if (status === "waitlisted") {
        setMsg({ type: "info", text: "Ajouté à la liste d'attente" });
      } else {
        setMsg({ type: "info", text: "Inscription enregistrée" });
      }

      // Reset du formulaire
      setFormData({
        fullName: "",
        email: "",
        company: "",
        commercial: "",
        technicalLevel: "",
        role: "",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMsg({ type: "error", text: "Erreur : " + error.message });
      } else {
        setMsg({ type: "error", text: "Erreur inconnue" });
      }
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage =
    (counts.confirmed_count / (sessionMode === "presentiel" ? 7 : capacity)) *
    100;

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

      {/* ✅ Progression des inscriptions */}
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

      {/* ✅ Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Nom & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              👤 Nom complet *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              ✉️ Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        {/* Société */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">🏢 Société</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
            placeholder="Nom de votre société"
          />
        </div>

        {/* Niveau technique */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            🎯 Niveau technique
          </label>
          <select
            required
            value={formData.technicalLevel}
            onChange={(e) =>
              setFormData({ ...formData, technicalLevel: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
          >
            <option value="">Évaluer...</option>
            <option value="Débutant">Débutant</option>
            <option value="Intermédiaire">Intermédiaire</option>
            <option value="Avancé">Avancé</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        {/* Rôle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            💼 Poste / Fonction
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
          >
            <option value="">Sélectionner...</option>
            <option value="Développeur">Développeur</option>
            <option value="Tech Lead">Tech Lead</option>
            <option value="Architecte">Architecte</option>
            <option value="CTO/Directeur technique">
              CTO/Directeur technique
            </option>
            <option value="Manager">Manager</option>
            <option value="Consultant">Consultant</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        {/* Commercial */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            👨‍💼 Commercial responsable
          </label>
          <select
            required
            value={formData.commercial}
            onChange={(e) =>
              setFormData({ ...formData, commercial: e.target.value })
            }
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl"
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
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          {loading ? "Inscription en cours..." : "Confirmer l'inscription"}
        </button>
      </form>

      {/* ✅ Messages */}
      {msg && (
        <div className="mt-6 p-4 rounded-xl border">
          <span>{msg.text}</span>
        </div>
      )}

      {/* ✅ Historique */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">📋 Historique récent</h3>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="text-sm">
                <span className="font-semibold">
                  {formatDateTime(h.created_at)}
                </span>{" "}
                - {h.commercial} a inscrit {h.participant} ({h.company})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
