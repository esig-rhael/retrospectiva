"use client";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { AppLogo } from "../../components/AppLogo";

export default function ResetPasswordPage() { const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [ready, setReady] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!supabase) return; void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session))); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase || password.length < 6) { setMessage("A senha deve ter pelo menos 6 caracteres."); return; } if (password !== confirm) { setMessage("As senhas não coincidem."); return; } setSaving(true); const result = await supabase.auth.updateUser({ password }); setSaving(false); if (result.error) setMessage("Não foi possível atualizar a senha. Solicite um novo link."); else { setMessage("Senha atualizada com sucesso."); setTimeout(() => { window.location.href = "/"; }, 1200); } }
  return <main className="shell auth-page"><AppLogo /><section className="auth-card"><h2>Definir nova senha</h2>{!ready ? <p className="hint">Aguardando validação do link...</p> : <form className="form" onSubmit={submit}><label>Nova senha<input autoFocus type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirmar senha<input type="password" minLength={6} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><button disabled={saving}>{saving ? "Salvando..." : "Salvar nova senha"}</button></form>}{message && <p className="hint">{message}</p>}</section></main>;
}
