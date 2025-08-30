import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("participants").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
