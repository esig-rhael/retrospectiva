import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clients(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization");
  if (!url || !anon || !service || !authorization?.startsWith("Bearer ")) return null;
  return { url, service, user: createClient(url, anon, { global: { headers: { Authorization: authorization } } }) };
}
function hash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function POST(request: Request) {
  const access = clients(request); if (!access) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const current = await access.user.auth.getUser(); if (current.error || !current.data.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json(); const action = body.action ?? "create"; const admin = createClient(access.url, access.service);
  if (action === "revoke") {
    const linkId = String(body.linkId ?? "");
    const link = await admin.from("board_invite_links").select("id,board_id").eq("id", linkId).maybeSingle();
    if (!link.data) return NextResponse.json({ error: "Link não encontrado." }, { status: 404 });
    const profile = await access.user.from("profiles").select("role").eq("id", current.data.user.id).maybeSingle();
    const board = await access.user.from("boards").select("owner_id").eq("id", link.data.board_id).maybeSingle();
    const managerInvite = await access.user.from("board_invites").select("id").eq("board_id", link.data.board_id).eq("email", current.data.user.email?.toLowerCase() ?? "").eq("role", "gestor").maybeSingle();
    if (board.data?.owner_id !== current.data.user.id && !(profile.data?.role === "gestor" && managerInvite.data)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    await admin.from("board_invite_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId);
    return NextResponse.json({ ok: true });
  }
  if (action === "claim") {
    const token = String(body.token ?? ""); if (!token) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
    const link = await admin.from("board_invite_links").select("id,board_id,role,created_by,expires_at,revoked_at,claimed_at").eq("token_hash", hash(token)).maybeSingle();
    if (link.error || !link.data || link.data.revoked_at || link.data.claimed_at || new Date(link.data.expires_at) < new Date()) return NextResponse.json({ error: "Este convite expirou ou já foi utilizado." }, { status: 410 });
    const user = current.data.user; const email = user.email?.toLowerCase(); if (!email) return NextResponse.json({ error: "Conta sem e-mail." }, { status: 400 });
    const invite = await admin.from("board_invites").upsert({ board_id: link.data.board_id, email, role: link.data.role, invited_by: link.data.created_by }, { onConflict: "board_id,email" });
    if (invite.error) return NextResponse.json({ error: invite.error.message }, { status: 400 });
    await admin.from("board_invite_links").update({ claimed_at: new Date().toISOString(), claimed_by: user.id }).eq("id", link.data.id);
    return NextResponse.json({ ok: true, boardId: link.data.board_id });
  }
  const boardId = String(body.boardId ?? ""); const role = body.role === "gestor" ? "gestor" : "participante"; const user = current.data.user;
  const profile = await access.user.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const board = await access.user.from("boards").select("owner_id").eq("id", boardId).maybeSingle();
  const isOwner = board.data?.owner_id === user.id;
  const managerInvite = await access.user.from("board_invites").select("id").eq("board_id", boardId).eq("email", user.email?.toLowerCase() ?? "").eq("role", "gestor").maybeSingle();
  if (!isOwner && !(profile.data?.role === "gestor" && managerInvite.data)) return NextResponse.json({ error: "Sem permissão para criar convite." }, { status: 403 });
  const token = randomBytes(32).toString("hex"); const result = await admin.from("board_invite_links").insert({ board_id: boardId, token_hash: hash(token), role: isOwner ? role : "participante", created_by: user.id }).select("id,expires_at").single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.json({ id: result.data.id, url: `${base}/convite/${token}`, expiresAt: result.data.expires_at });
}



