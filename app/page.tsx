"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Column = { id: string; title: string; position: number; cards: { id: string; content: string }[] };
const defaultBoard = "00000000-0000-0000-0000-000000000001";

export default function Home() {
  const [columns, setColumns] = useState<Column[]>([]); const [error, setError] = useState(""); const [adding, setAdding] = useState<string | null>(null); const [content, setContent] = useState("");
  async function load() {
    if (!supabase) { setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para conectar ao Supabase."); return; }
    const { data, error } = await supabase.from("board_columns").select("id,title,position,cards(id,content)").eq("board_id", defaultBoard).order("position");
    if (error) setError(error.message); else setColumns((data ?? []) as Column[]);
  }
  useEffect(() => { void load(); if (!supabase) return; const channel = supabase.channel("board-cards").on("postgres_changes", { event: "*", schema: "public", table: "cards" }, () => void load()).subscribe(); return () => { void supabase.removeChannel(channel); }; }, []);
  async function addCard(columnId: string) { if (!supabase || !content.trim()) return; const { error } = await supabase.from("cards").insert({ column_id: columnId, content: content.trim() }); if (error) setError(error.message); else { setContent(""); setAdding(null); await load(); } }
  return <main className="shell"><div className="eyebrow">MVP colaborativo</div><h1>Retrospectiva</h1>{error && <p className="error">{error}</p>}<section className="board">{columns.map(column => <article className="column" key={column.id}><h2>{column.title}</h2><div className="cards">{column.cards?.map(card => <div className="card" key={card.id}>{card.content}</div>)}</div>{adding === column.id ? <div className="form"><input autoFocus value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void addCard(column.id); }} placeholder="Escreva um card" /><button onClick={() => void addCard(column.id)}>Salvar card</button><button onClick={() => setAdding(null)}>Cancelar</button></div> : <button className="add" onClick={() => setAdding(column.id)}>+ adicionar</button>}</article>)}</section></main>;
}
