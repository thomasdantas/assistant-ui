# assistant-ui (demo full-stack)

Aplicacao minima com **Bun workspaces**, **frontend React + assistant-ui** e
**backend Express + AI SDK**.

## Requisitos

- Bun 1.3+
- Chave [OpenAI](https://platform.openai.com/api-keys) em `server/.env`

## Configurar

```bash
cp server/.env.example server/.env
# Edite server/.env e defina OPENAI_API_KEY=...
```

## Executar

Na raiz do repositorio:

```bash
bun install
bun run dev
```

- Frontend: <http://localhost:5173>
- API Express: `POST http://localhost:3000/chat`

## Detalhes

- `client/` usa `assistant-ui` com um componente inspirado em `ChatAssistant.tsx`
  da raiz e envia para `/api/chat`
- `server/` usa Express e reaproveita `getClassificationModel()` de
  `agents/aiModels.ts`
- o Vite faz proxy de `/api/*` para a API na porta `3000`

## Scripts

```bash
bun run dev
bun run dev:client
bun run dev:server
bun run typecheck
```
