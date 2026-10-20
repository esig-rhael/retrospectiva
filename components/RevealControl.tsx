"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function RevealControl({ boardId }: { boardId: string }) {
  const [allowed, setAllowed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    const user = await supabase.auth.getUser();
    const board = await supabase.from("boards").select("owner_id,cards_revealed").eq("id", boardId).maybeSingle();
    if (!user.data.user) { setLoading(false); return; }
    if (board.data?.owner_id === user.data.user.id) setAllowed(true);
    else {
      const profile = await supabase.from("profiles").select("role").eq("id", user.data.user.id).maybeSingle();
      const invite = await supabase.from("board_invites").select("role").eq("board_id", boardId).eq("email", user.data.user.email?.toLowerCase() ?? "").maybeSingle();
      setAllowed(profile.data?.role === "gestor" && invite.data?.role === "gestor");
    }
    setRevealed(Boolean(board.data?.cards_revealed));
    setLoading(false);
  }

  useEffect(() => {
    void load();
    if (!supabase) return;
    const channel = supabase.channel(`board-reveal-${boardId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` }, payload => {
      const next = payload.new as { cards_revealed?: boolean };
      if (typeof next.cards_revealed === "boolean") setRevealed(next.cards_revealed);
    }).subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [boardId]);

  async function toggle() {
    if (!supabase || !allowed || loading) return;
    setLoading(true);
    const result = await supabase.from("boards").update({ cards_revealed: !revealed }).eq("id", boardId);
    if (!result.error) setRevealed(!revealed);
    setLoading(false);
  }

  if (!allowed) return null;
  return <button className={revealed ? "reveal-control is-revealed" : "reveal-control"} type="button" disabled={loading} onClick={() => void toggle()}>{revealed ? "Ocultar cards" : "Revelar cards"}</button>;
}

