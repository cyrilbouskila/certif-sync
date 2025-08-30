import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

// GET toutes les sessions
export async function GET() {
  const { data, error } = await supabase.from("sessions").select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST pour créer une session
export async function POST(req: Request) {
  const body = await req.json()
  const { title, mode, starts_at, ends_at, capacity, location } = body

  const { data, error } = await supabase
    .from("sessions")
    .insert([{ title, mode, starts_at, ends_at, capacity, location }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
