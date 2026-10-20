"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ExportCard = { column_id: string; content: string };
type ExportColumn = { id: string; title: string; position: number; cards: ExportCard[] };

export function ExportPdfButton({ boardId }: { boardId: string }) {
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    void Promise.all([
      client.auth.getUser(),
      client.from("boards").select("owner_id").eq("id", boardId).maybeSingle()
    ]).then(async ([user, board]) => {
      if (!user.data.user) return;
      if (board.data?.owner_id === user.data.user.id) { setAllowed(true); return; }
      const profile = await client.from("profiles").select("role").eq("id", user.data.user.id).maybeSingle();
      const invite = await client.from("board_invites").select("role").eq("board_id", boardId).eq("email", user.data.user.email?.toLowerCase() ?? "").maybeSingle();
      setAllowed(profile.data?.role === "gestor" && invite.data?.role === "gestor");
    });
  }, [boardId]);

  async function exportMarkdown() {
    if (!supabase) return;
    setExporting(true);
    const board = await supabase.from("boards").select("title").eq("id", boardId).single();
    const columns = await supabase.from("board_columns").select("id,title,position").eq("board_id", boardId).order("position");
    const rows = columns.data ?? [];
    const cards = rows.length
      ? await supabase.from("cards").select("column_id,content").in("column_id", rows.map(column => column.id))
      : { data: [] as ExportCard[] };
    const grouped = rows.map(column => ({
      ...column,
      cards: (cards.data ?? []).filter(card => card.column_id === column.id)
    })) as ExportColumn[];
    const markdown = [
      `# ${board.data?.title ?? "Retrospectiva"}`,
      "",
      `Exportado em ${new Date().toLocaleString("pt-BR")}`,
      "",
      ...grouped.flatMap(column => [
        `## ${column.title}`,
        "",
        ...(column.cards.length ? column.cards.flatMap(card => [`- ${card.content.replace(/\\n/g, " ")}`, ""]) : ["_Nenhum card._", ""])
      ])
    ].join("\n");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(board.data?.title ?? "retrospectiva").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-resumo.md`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (!allowed) return null;
  return <div className="export-menu">
    <button className="print-button" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>Exportar</button>
    {open && <div className="export-menu-panel" role="menu">
      <button type="button" onClick={() => { setOpen(false); window.print(); }}>PDF completo</button>
      <button type="button" disabled={exporting} onClick={() => { setOpen(false); void exportMarkdown(); }}>{exporting ? "Preparando..." : "Resumo em Markdown"}</button>
    </div>}
  </div>;
}







