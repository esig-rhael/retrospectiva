# Retrospectiva MVP

Prova técnica mínima: board, quatro colunas, cards persistidos e atualização via Supabase Realtime.

## Configuração

1. Instale Node.js LTS.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e preencha as duas variáveis públicas do projeto Supabase.
4. No SQL Editor do Supabase, execute `supabase/migrations/001_initial.sql`.
5. Execute `npm run dev` e abra `http://localhost:3000` em duas abas.

A migration cria o board de teste com ID fixo, as quatro colunas padrão, políticas públicas mínimas para a prova e adiciona `cards` à publicação Realtime. Em produção, substitua essas políticas por autenticação e autorização.
