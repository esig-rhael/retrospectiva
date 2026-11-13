"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { AppLogo } from "../../../components/AppLogo";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState(""); const [message, setMessage] = useState("Validando convite...");
  useEffect(() => { void params.then(value => setToken(value.token)); }, [params]);
  useEffect(() => {
    const client = supabase;
    if (!token || !client) return;
    void client.auth.getUser().then(async ({ data }) => {
      if (!data.user) { sessionStorage.setItem("rretro-invite-token", token); setMessage("Faça login ou crie sua conta para aceitar este convite."); return; }
      const session = await client.auth.getSession();
      const result = await fetch("/api/board-invite-link", { method: "POST", headers: { Authorization: `Bearer ${session.data.session?.access_token ?? ""}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", token }) });
      const body = await result.json();
      if (!result.ok) { setMessage(body.error ?? "Convite inválido."); return; }
      setMessage("Convite aceito! Redirecionando...");
      window.location.href = `/board/${body.boardId}`;
    });
  }, [token]);
  return <main className="shell auth-page"><AppLogo /><section className="auth-card"><h2>Convite para board</h2><p className="hint">{message}</p><a className="primary-button" href="/">Ir para login</a></section></main>;
}





