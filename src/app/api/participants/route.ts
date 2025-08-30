import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

// GET tous les participants
export async function GET() {
  const { data, error } = await supabase
    .from("participants")
    .select("*, sessions(title, starts_at, mode)") // inclut aussi la session associée

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST pour ajouter un participant
export async function POST(req: Request) {
  const body = await req.json()
  const { session_id, first_name, last_name, email, company, added_by } = body

  const { data, error } = await supabase
    .from("participants")
    .insert([{ session_id, first_name, last_name, email, company, added_by }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
