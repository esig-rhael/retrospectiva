"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { BoardTimer } from "./BoardTimer";
import { ExportPdfButton } from "./ExportPdfButton";
import { RevealButtonStyle } from "./RevealButtonStyle";
import { BoardSettings } from "./BoardSettings";
import { AppLogo } from "./AppLogo";
import { SharePopover } from "./SharePopover";
import { RevealControl } from "./RevealControl";

export function UserBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const boardId = typeof window !== "undefined" && window.location.pathname.startsWith("/board/")
    ? window.location.pathname.split("/")[2]
    : null;
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin/");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    void client.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const profile = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        setIsMaster(profile.data?.role === "master");
      }
    });
  }, []);

  if (!email) return null;

  return (
    <>
      <RevealButtonStyle />
      <div className={isAdmin ? "user-bar admin-user-bar" : "user-bar"}>
        <AppLogo />
        <span className="user-email" title={email}>Conectado como {email}</span>
        {isMaster && <><a href="/admin/users">Administração</a><a href="/admin/audit">Histórico</a></>}
        <button className="text-button" onClick={() => void supabase?.auth.signOut().then(() => { window.location.href = "/"; })}>Sair</button>
      </div>
      {boardId && <div className="board-tools">
        <BoardTimer boardId={boardId} />
        <RevealControl boardId={boardId} />
        <ExportPdfButton boardId={boardId} />
        <SharePopover boardId={boardId} />
        <BoardSettings boardId={boardId} />
      </div>}
    </>
  );
}

