"use client";
import { useEffect } from "react";
export function RevealButtonStyle() { useEffect(() => { const update = () => { const button = document.querySelector<HTMLButtonElement>(".share > button:first-child"); if (button) button.classList.toggle("is-revealed", button.textContent?.includes("Ocultar") ?? false); }; update(); const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true, characterData: true }); return () => observer.disconnect(); }, []); return null; }
