"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthForm } from "../components/AuthForm";
import { UserBar } from "../components/UserBar";
type Board = { id: string; title: string; created_at: string };
export default function Home() { const [boards, setBoards] = useState<Board[]>([]); const [title, setTitle] = useState(""); const [error, setError] = useState("");
  async function load() { if (!supabase) { setError("Configure as variáveis do Supabase."); return; } const { data, error } = await supabase.from("boards").select("id,title,created_at").order("created_at", { ascending: false }); if (error) setError(error.message); else setBoards(data ?? []); }
  useEffect(() => { void load(); }, []);
  async function createBoard() { if (!supabase || !title.trim()) return; const user = await supabase.auth.getUser(); if (!user.data.user) { setError("Entre na sua conta para criar um board."); return; } const { data, error } = await supabase.from("boards").insert({ title: title.trim(), owner_id: user.data.user.id }).select("id").single(); if (error) { setError(error.message); return; } const columns = ["O que deu certo", "O que não deu certo", "Melhorar", "Planos de Ação"].map((name, position) => ({ board_id: data.id, title: name, position: position + 1 })); const result = await supabase.from("board_columns").insert(columns); if (result.error) setError(result.error.message); else window.location.href = `/board/${data.id}`; }
  return <main className="shell"><UserBar /><div className="eyebrow">MVP colaborativo</div><h1>Retrospectivas</h1><AuthForm onAuthenticated={() => window.location.reload()} />{error && <p className="error">{error}</p>}<div className="form"><input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void createBoard(); }} placeholder="Nome da nova retrospectiva" /><button onClick={() => void createBoard()}>Criar board</button></div><section className="boards">{boards.map(board => <a className="board-link" href={`/board/${board.id}`} key={board.id}>{board.title}<span>Abrir board →</span></a>)}</section></main>; }
