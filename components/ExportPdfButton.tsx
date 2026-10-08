"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export function ExportPdfButton({ boardId }: { boardId: string }) { const [owner, setOwner] = useState(false); useEffect(() => { if (!supabase) return; void Promise.all([supabase.auth.getUser(), supabase.from("boards").select("owner_id").eq("id", boardId).maybeSingle()]).then(([user, board]) => setOwner(Boolean(user.data.user && board.data?.owner_id === user.data.user.id))); }, [boardId]); if (!owner) return null; return <button className="print-button" onClick={() => window.print()}>Exportar PDF</button>; }
