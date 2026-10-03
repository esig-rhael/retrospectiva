"use client";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

export function AuthForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase) { setMessage("Configure as variáveis do Supabase."); return; } setLoading(true); setMessage(""); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setLoading(false); if (result.error) setMessage(result.error.message); else if (mode === "signup" && !result.data.session) setMessage("Cadastro criado. Verifique seu e-mail para confirmar a conta."); else onAuthenticated(); }
  return <div className="auth-card"><h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2><form className="form" onSubmit={submit}><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha (mínimo 6 caracteres)" /><button disabled={loading}>{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}</button></form>{message && <p className="hint">{message}</p>}<button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}</button></div>;
}
