"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ChatAssistant() {
  // ✅ Hooks déclarés en haut
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    "📊 Voir les sessions disponibles",
    "👥 Voir tous les participants",
    "➕ Ajouter un participant",
  ]

  // 🚀 Envoi message API
  async function sendMessage() {
    if (!input.trim()) return
    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!res.ok) {
        let errorMessage = "❌ Erreur inconnue côté serveur."
        if (res.status === 429) errorMessage = "⚠️ Plus de crédits OpenAI disponibles."
        if (res.status === 500) errorMessage = "❌ Erreur côté serveur, vérifie ta clé API."
        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }])
        return
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply || "⚠️ Pas de réponse" },
      ])
    } catch (error) {
      console.error("Erreur API:", error)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "❌ Erreur de connexion au serveur." },
      ])
    }
  }

  // ⬇️ Scroll auto en bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // ✅ Formatage des listes
  function formatMessage(content: string) {
    if (content.includes("|")) {
      const lignes = content
        .split("\n")
        .filter(l => l.includes("|") && !l.includes("----"))
        .map((l, i) => (
          <li key={i} className="mb-1">
            {l.replace(/\|/g, " ").trim()}
          </li>
        ))
      return <ul className="list-disc list-inside pl-4">{lignes}</ul>
    }
    return <span>{content}</span>
  }

  // ✅ Rendu UI
  return (
    <div className="fixed bottom-4 right-4">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 text-white flex items-center justify-center"
        >
          💬
        </Button>
      )}

      {isOpen && (
        <Card
          className={`shadow-2xl rounded-2xl transition-all duration-300 flex flex-col
            ${isExpanded ? "w-[700px] h-[700px]" : "w-96 h-[500px]"}`}
        >
          <CardHeader className="flex justify-between items-center font-bold">
            Assistant Certif 🎓
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Réduire" : "Agrandir"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-lg"
              >
                ✖
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 overflow-hidden">
            {/* Zone messages */}
            <div
              ref={scrollRef}
              className="flex-1 border rounded-md p-2 mb-2 overflow-y-auto"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "bg-blue-200 p-2 rounded-xl inline-block max-w-full break-words"
                        : "bg-gray-200 p-2 rounded-xl inline-block max-w-full whitespace-pre-wrap font-sans block"
                    }
                  >
                    {formatMessage(m.content)}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions + Input */}
            <div className="mt-2 shrink-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setInput(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Pose ta question..."
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage}>Envoyer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
