import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const service = process.env.SUPABASE_SERVICE_ROLE_KEY; const authorization = request.headers.get("authorization");
  if (!url || !anon || !service || !authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } }); const current = await userClient.auth.getUser(); if (current.error || !current.data.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); const role = await userClient.from("profiles").select("role").eq("id", current.data.user.id).maybeSingle(); if (role.data?.role !== "master") return NextResponse.json({ error: "Apenas o Master pode remover usuários." }, { status: 403 });
  const body = await request.json(); const userId = String(body.userId ?? ""); if (!userId || userId === current.data.user.id) return NextResponse.json({ error: "Não é possível remover este usuário." }, { status: 400 });
  const admin = createClient(url, service); const result = await admin.auth.admin.deleteUser(userId); if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 }); return NextResponse.json({ ok: true });
}
