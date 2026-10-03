"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export function CardReactions({ cardId }: { cardId: string }) { const [count, setCount] = useState(0); const [reacted, setReacted] = useState(false);
  async function load() { if (!supabase) return; const user = await supabase.auth.getUser(); const rows = await supabase.from("card_reactions").select("user_id").eq("card_id", cardId); if (!rows.error) { setCount(rows.data.length); setReacted(Boolean(user.data.user && rows.data.some(row => row.user_id === user.data.user?.id))); } }
  useEffect(() => { void load(); if (!supabase) return; const channel = supabase.channel(`reactions-${cardId}`).on("postgres_changes", { event: "*", schema: "public", table: "card_reactions", filter: `card_id=eq.${cardId}` }, () => void load()).subscribe(); return () => { void supabase?.removeChannel(channel); }; }, [cardId]);
  async function toggle() { if (!supabase) return; const user = await supabase.auth.getUser(); if (!user.data.user) return; if (reacted) await supabase.from("card_reactions").delete().eq("card_id", cardId).eq("user_id", user.data.user.id); else await supabase.from("card_reactions").insert({ card_id: cardId, user_id: user.data.user.id }); await load(); }
  return <button className={`reaction ${reacted ? "active" : ""}`} onClick={() => void toggle()}>👍 {count}</button>; }
