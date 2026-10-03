"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export function UserBar() { const [email, setEmail] = useState<string | null>(null); useEffect(() => { if (!supabase) return; void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)); }, []); if (!email) return null; return <div className="user-bar">Conectado como {email}<button className="text-button" onClick={() => void supabase?.auth.signOut().then(() => { window.location.href = "/"; })}>Sair</button></div>; }
