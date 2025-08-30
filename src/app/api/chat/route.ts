import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE! // clé secrète côté serveur
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    let extraContext = "";

    // 👉 Regex pour détecter mois et année
    const moisRegex =
      /(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i;
    const anneeRegex = /(20\d{2})/;

    const moisMatch = lastMessage.match(moisRegex);
    const anneeMatch = lastMessage.match(anneeRegex);

    // 👉 Recherche sessions
    if (lastMessage.toLowerCase().includes("session")) {
      let { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, title, starts_at, location, mode")
        .order("starts_at", { ascending: true });

      if (error) console.error(error);

      if (sessions) {
        sessions = sessions.filter((s) => {
          const date = new Date(s.starts_at);
          const mois = date
            .toLocaleDateString("fr-FR", { month: "long" })
            .toLowerCase();
          const annee = date.getFullYear().toString();
          return (
            (!moisMatch || mois.includes(moisMatch[0].toLowerCase())) &&
            (!anneeMatch || annee === anneeMatch[0])
          );
        });
      }

      if (sessions && sessions.length > 0) {
        const rows = sessions
          .map(
            (s) =>
              `• ${s.title} — ${new Date(s.starts_at).toLocaleDateString(
                "fr-FR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )} — ${s.location || "Lieu à confirmer"} — ${s.mode || "N/A"}`
          )
          .join("\n");

        extraContext = `📋 Sessions trouvées :\n\n${rows}`;
      } else {
        extraContext = "⚠️ Aucune session trouvée dans Supabase.";
      }
    }

    // 👉 Recherche participants
    if (lastMessage.toLowerCase().includes("participant")) {
      let { data: participants, error } = await supabase
        .from("participants")
        .select("id, full_name, email, session_id")
        .order("full_name", { ascending: true });

      if (error) console.error(error);

      if (participants && participants.length > 0) {
        // Récupération des sessions liées
        const sessionIds = participants.map((p) => p.session_id);
        const { data: sessions, error: errSessions } = await supabase
          .from("sessions")
          .select("id, title, starts_at")
          .in("id", sessionIds);

        if (errSessions) console.error(errSessions);

        // ⚡ Filtrage par mois/année si demandé
        let filteredParticipants = participants;
        if (moisMatch || anneeMatch) {
          filteredParticipants = participants.filter((p) => {
            const session = sessions?.find((s) => s.id === p.session_id);
            if (!session) return false;
            const date = new Date(session.starts_at);
            const mois = date
              .toLocaleDateString("fr-FR", { month: "long" })
              .toLowerCase();
            const annee = date.getFullYear().toString();
            return (
              (!moisMatch || mois.includes(moisMatch[0].toLowerCase())) &&
              (!anneeMatch || annee === anneeMatch[0])
            );
          });
        }

        if (filteredParticipants.length > 0) {
          const rows = filteredParticipants
            .map((p) => {
              const session = sessions?.find((s) => s.id === p.session_id);
              return `👤 ${p.full_name} — 📧 ${p.email} — 🎓 ${
                session?.title || "N/A"
              }`;
            })
            .join("\n");

          extraContext = `👥 Participants inscrits :\n\n${rows}`;
        } else {
          extraContext =
            "⚠️ Aucun participant trouvé dans Supabase pour la période demandée.";
        }
      } else {
        extraContext = "⚠️ Aucun participant trouvé dans Supabase.";
      }
    }

    // 👉 Intention "ajouter un participant"
    if (
      lastMessage.toLowerCase().includes("ajouter un participant") ||
      lastMessage.toLowerCase().includes("inscrire un participant")
    ) {
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, title, starts_at");

      if (error) console.error(error);

      if (sessions && sessions.length > 0) {
        // On cherche une session qui correspond à ce que l’utilisateur a écrit
        const targetSession = sessions.find((s) => {
          const date = new Date(s.starts_at);
          const mois = date
            .toLocaleDateString("fr-FR", { month: "long" })
            .toLowerCase();
          const annee = date.getFullYear().toString();
          return (
            lastMessage.toLowerCase().includes(s.title.toLowerCase()) ||
            (moisMatch && mois.includes(moisMatch[0].toLowerCase())) ||
            (anneeMatch && annee === anneeMatch[0])
          );
        });

        if (targetSession) {
          extraContext = `✅ Tu peux inscrire ton participant ici 👉 /sessions/${targetSession.id}/register`;
        } else {
          extraContext = `⚠️ Je n’ai pas trouvé la session demandée.`;
        }
      }
    }

    // 🔥 Prompt strict
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Tu es Assistant Certif 🎓.  
Tu réponds UNIQUEMENT avec les données fournies dans le contexte Supabase.  
Si une information n’est pas trouvée, tu dis clairement :  
⚠️ "Je n’ai pas trouvé cette information dans la base Supabase."  

Toujours formater :  
- Les sessions en **liste avec puces**.  
- Les participants en **liste avec icônes (Nom, Email, Session)**.  
- Et si c’est une demande d’inscription, tu donnes un **lien direct vers le formulaire**.  
          `,
        },
        { role: "system", content: extraContext },
        ...messages,
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "⚠️ Pas de réponse du modèle.";
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Erreur API OpenAI:", error);
    return NextResponse.json(
      { reply: "❌ Erreur côté serveur : " + error.message },
      { status: 500 }
    );
  }
}
