"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function RevealControl({ boardId }: { boardId: string }) { const [owner, setOwner] = useState(false); const [revealed, setRevealed] = useState(false); const [loading, setLoading] = useState(true);
  async function load() { if (!supabase) return; const user = await supabase.auth.getUser(); const board = await supabase.from("boards").select("owner_id,cards_revealed").eq("id", boardId).maybeSingle(); setOwner(Boolean(user.data.user && board.data?.owner_id === user.data.user.id)); setRevealed(Boolean(board.data?.cards_revealed)); setLoading(false); }
  useEffect(() => { void load(); if (!supabase) return; const channel = supabase.channel(`board-reveal-${boardId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` }, payload => { const next = payload.new as { cards_revealed?: boolean }; if (typeof next.cards_revealed === "boolean") setRevealed(next.cards_revealed); }).subscribe(); return () => { void supabase?.removeChannel(channel); }; }, [boardId]);
  async function toggle() { if (!supabase || !owner || loading) return; setLoading(true); const result = await supabase.from("boards").update({ cards_revealed: !revealed }).eq("id", boardId); if (!result.error) setRevealed(!revealed); setLoading(false); }
  if (!owner) return null; return <button className={revealed ? "reveal-control is-revealed" : "reveal-control"} type="button" disabled={loading} onClick={() => void toggle()}>{revealed ? "Ocultar cards" : "Revelar cards"}</button>;
}
