import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function authorize(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const service = process.env.SUPABASE_SERVICE_ROLE_KEY; const authorization = request.headers.get("authorization");
  if (!url || !anon || !service || !authorization?.startsWith("Bearer ")) return null;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } }); const current = await userClient.auth.getUser(); if (current.error || !current.data.user) return null; const role = await userClient.from("profiles").select("role").eq("id", current.data.user.id).maybeSingle(); return role.data?.role === "master" ? { url, service } : null;
}

export async function GET(request: Request) {
  const access = await authorize(request); if (!access) return NextResponse.json({ error: "Acesso permitido apenas ao Master." }, { status: 403 }); const admin = createClient(access.url, access.service); const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 }); return NextResponse.json({ users: result.data.users.map(user => ({ id: user.id, email: user.email, confirmed: Boolean(user.email_confirmed_at) })) });
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ error: "Configuração do Supabase incompleta no servidor." }, { status: 500 });
  const authorization = request.headers.get("authorization"); if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } }); const current = await userClient.auth.getUser(); if (current.error || !current.data.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const role = await userClient.from("profiles").select("role").eq("id", current.data.user.id).maybeSingle(); if (role.data?.role !== "master") return NextResponse.json({ error: "Apenas o Master pode reenviar convites." }, { status: 403 });
  const body = await request.json(); const email = String(body.email ?? "").trim().toLowerCase(); if (!email) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  const admin = createClient(url, service); const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); const target = users.data.users.find(user => user.email?.toLowerCase() === email); if (!target) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 }); if (target.email_confirmed_at) return NextResponse.json({ error: "Este usuário já confirmou o e-mail." }, { status: 400 });
  const result = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: new URL("/", request.url).toString() }); if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 }); return NextResponse.json({ ok: true });
}
