"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SessionCard({ session }: { session: any }) {
  const placesRestantes = session.capacity - (session.participants?.length || 0)

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle>{session.title}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge>{session.mode}</Badge>
          <Badge className={placesRestantes > 0 ? "bg-green-500" : "bg-red-500"}>
            Places restantes : {placesRestantes}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p>{new Date(session.starts_at).toLocaleString("fr-FR")} → {new Date(session.ends_at).toLocaleString("fr-FR")}</p>
        <p>{session.location}</p>
      </CardContent>
    </Card>
  )
}
