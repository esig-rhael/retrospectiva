"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { UserBar } from "../../../components/UserBar";
import { CardReactions } from "../../../components/CardReactions";

type Card = { id: string; column_id: string; content: string; author_id: string | null; group_id: string | null };
type Column = { id: string; title: string; position: number; cards: Card[] };
type Invite = { id: string; email: string };

export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const [title, setTitle] = useState("Retrospectiva");
  const [userId, setUserId] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; action: () => void } | null>(null);

  async function load() {
    if (!supabase) { setError("Configure as variáveis do Supabase."); return; }
    const user = await supabase.auth.getUser();
    setUserId(user.data.user?.id ?? null);
    const board = await supabase.from("boards").select("title,owner_id,cards_revealed").eq("id", boardId).maybeSingle();
    if (board.error) { setError(board.error.message); return; }
    if (!board.data) { window.location.href = "/"; return; }
    setTitle(board.data.title);
    setRevealed(board.data.cards_revealed);
    const isOwner = Boolean(user.data.user && board.data.owner_id === user.data.user.id);
    setOwner(isOwner);
    if (isOwner) {
      const invitation = await supabase.from("board_invites").select("id,email").eq("board_id", boardId);
      setInvites(invitation.data ?? []);
    }
    const columnResult = await supabase.from("board_columns").select("id,title,position").eq("board_id", boardId).order("position");
    if (columnResult.error) { setError(columnResult.error.message); return; }
    const columnRows = columnResult.data ?? [];
    const cardResult = columnRows.length
      ? await supabase.from("cards").select("id,column_id,content,author_id,group_id").in("column_id", columnRows.map(column => column.id))
      : { data: [], error: null };
    if (cardResult.error) { setError(cardResult.error.message); return; }
    setColumns(columnRows.map(column => ({ ...column, cards: (cardResult.data ?? []).filter(card => card.column_id === column.id) })) as Column[]);
  }

  useEffect(() => {
    void load();
    const client = supabase;
    if (!client) return;
    const channel = client.channel(`board-cards-${boardId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, () => void load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` }, () => void load())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [boardId]);

  async function addCard(columnId: string) {
    if (!supabase || !content.trim()) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    const result = await supabase.from("cards").insert({ column_id: columnId, content: content.trim(), author_id: user.data.user.id });
    if (result.error) setError(result.error.message);
    else { setContent(""); setAdding(null); await load(); }
  }

  async function editCard(card: Card) {
    if (!supabase || !editingContent.trim()) return;
    const result = await supabase.from("cards").update({ content: editingContent.trim() }).eq("id", card.id);
    if (result.error) setError(result.error.message);
    else { setEditingId(null); setEditingContent(""); await load(); }
  }

  async function deleteCard(card: Card) {
    if (!supabase) return;
    const result = await supabase.from("cards").delete().eq("id", card.id);
    if (result.error) setError(result.error.message);
    else await load();
  }

  async function moveCard(card: Card, columnId: string, groupId: string | null = null) {
    const client = supabase;
    if (!client || card.column_id === columnId && card.group_id === groupId) return;
    const updates = [{ id: card.id, column_id: columnId, group_id: groupId }];
    if (!groupId) {
      const groupedChildren = columns.flatMap(item => item.cards).filter(item => item.group_id === card.id);
      updates.push(...groupedChildren.map(item => ({ id: item.id, column_id: columnId, group_id: null })));
    }
    const results = await Promise.all(updates.map(item => client.from("cards").update({ column_id: item.column_id, group_id: item.group_id }).eq("id", item.id)));
    const failed = results.find(result => result.error);
    if (failed?.error) setError(failed.error.message);
    else await load();
    setDraggedId(null); setDragOverId(null); setDragOverColumn(null);
  }

  function handleDropOnCard(target: Card) {
    const source = columns.flatMap(column => column.cards).find(card => card.id === draggedId);
    if (!source || source.id === target.id || source.column_id !== target.column_id) return;
    void moveCard(source, target.column_id, target.group_id ?? target.id);
  }

  function renderCard(card: Card, grouped = false) {
    const canManage = owner || card.author_id === userId;
    const visible = revealed || canManage;
    return <div className={`card${grouped ? " grouped-card" : ""}${dragOverId === card.id ? " drag-target" : ""}`} key={card.id}
      draggable={canManage} onDragStart={() => setDraggedId(card.id)} onDragEnd={() => { setDraggedId(null); setDragOverId(null); setDragOverColumn(null); }}
      onDragOver={event => { if (draggedId && draggedId !== card.id) { event.preventDefault(); setDragOverId(card.id); } }}
      onDrop={event => { event.preventDefault(); handleDropOnCard(card); }}>
      {editingId === card.id ? <div className="form"><input autoFocus value={editingContent} onChange={e => setEditingContent(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void editCard(card); }} /><button onClick={() => void editCard(card)}>Salvar</button><button onClick={() => { setEditingId(null); setEditingContent(""); }}>Cancelar</button></div> : <><span>{visible ? card.content : "Card oculto"}</span>{visible && <CardReactions cardId={card.id} />}{canManage && <div className="card-actions"><button className="text-button" onClick={() => { setEditingId(card.id); setEditingContent(card.content); }}>Editar</button><button className="text-button danger" onClick={() => setConfirmation({ title: "Excluir card?", message: "O card será removido permanentemente.", action: () => void deleteCard(card) })}>Excluir</button></div>}</>}
    </div>;
  }

  async function toggleReveal() {
    if (!supabase || !owner) return;
    const result = await supabase.from("boards").update({ cards_revealed: !revealed }).eq("id", boardId);
    if (result.error) setError(result.error.message); else setRevealed(!revealed);
  }

  async function invite() {
    if (!supabase || !inviteEmail.trim()) return;
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    const result = await supabase.from("board_invites").insert({ board_id: boardId, email: inviteEmail.trim().toLowerCase(), invited_by: user.data.user.id });
    if (result.error) setInviteMessage(result.error.message);
    else { setInviteMessage("Convite registrado com sucesso."); setInviteEmail(""); await load(); }
  }

  async function removeInvite(invite: Invite) {
    if (!supabase) return;
    const result = await supabase.from("board_invites").delete().eq("id", invite.id);
    if (result.error) setInviteMessage(result.error.message); else await load();
  }

  return <main className="shell"><UserBar /><a href="/">← Todos os boards</a><div className="eyebrow">Board colaborativo</div><h1>{title}</h1>{error && <p className="error">{error}</p>}
    {owner && <div className="share form"><button onClick={() => void toggleReveal()}>{revealed ? "Ocultar cards" : "Revelar cards"}</button><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="E-mail para compartilhar" /><button onClick={() => void invite()}>Compartilhar board</button>{inviteMessage && <p className="hint">{inviteMessage}</p>}{invites.map(inviteItem => <div className="invite-row" key={inviteItem.id}>{inviteItem.email}<button className="text-button" onClick={() => setConfirmation({ title: "Remover acesso?", message: `Remover o acesso de ${inviteItem.email} a este board?`, action: () => void removeInvite(inviteItem) })}>Remover</button></div>)}</div>}
    <section className="board">{columns.map(column => {
      const roots = column.cards.filter(card => !card.group_id || !column.cards.some(item => item.id === card.group_id));
      return <article className={`column${dragOverColumn === column.id ? " drag-column" : ""}`} key={column.id} onDragOver={event => { if (draggedId) { event.preventDefault(); setDragOverColumn(column.id); } }} onDrop={event => { event.preventDefault(); const source = columns.flatMap(item => item.cards).find(card => card.id === draggedId); if (source) void moveCard(source, column.id); }}>
        <h2>{column.title}</h2><div className="cards">{roots.map(root => <div className={column.cards.some(card => card.group_id === root.id) ? "card-group" : ""} key={root.id}>{renderCard(root)}{column.cards.filter(card => card.group_id === root.id).map(card => renderCard(card, true))}{column.cards.some(card => card.group_id === root.id) && <span className="group-label">Cards agrupados</span>}</div>)}</div>
        {adding === column.id ? <div className="form"><input autoFocus value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void addCard(column.id); }} placeholder="Escreva um card" /><button onClick={() => void addCard(column.id)}>Salvar card</button><button onClick={() => setAdding(null)}>Cancelar</button></div> : <button className="add" onClick={() => setAdding(column.id)}>+ adicionar</button>}
      </article>;
    })}</section>
    {confirmation && <div className="modal-backdrop" role="presentation"><section className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">{confirmation.title}</h2><p>{confirmation.message}</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setConfirmation(null)}>Cancelar</button><button className="danger-button" type="button" onClick={() => { const action = confirmation.action; setConfirmation(null); action(); }}>Confirmar</button></div></section></div>}
  </main>;
}





