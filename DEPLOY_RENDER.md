# Deploy do PrivyChat no Render

Este projeto esta pronto para deploy no Render usando `render.yaml`.

## 1. Suba o projeto para o GitHub

No terminal, dentro da pasta do projeto:

```powershell
git init
git add .
git commit -m "Deploy PrivyChat"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/privychat.git
git push -u origin main
```

## 2. Crie o banco MySQL

Use uma destas opcoes:

- Render MySQL template: https://render.com/docs/deploy-mysql
- Railway MySQL
- PlanetScale
- Aiven MySQL

Anote:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

## 3. Crie o Blueprint no Render

1. Acesse https://dashboard.render.com
2. Clique em `New`
3. Clique em `Blueprint`
4. Conecte o repositorio GitHub
5. Selecione o arquivo `render.yaml`
6. Preencha os valores solicitados

## 4. Variaveis do backend

Preencha no prompt do Render:

```env
CLIENT_URL=https://privychat-frontend.onrender.com
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=privychat
GOOGLE_CLIENT_ID=...
```

Depois que o frontend for criado, se o dominio for diferente, atualize `CLIENT_URL` no backend.

## 5. Variaveis do frontend

Preencha:

```env
VITE_API_URL=https://privychat-backend.onrender.com/api
VITE_SOCKET_URL=https://privychat-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=...
```

## 6. Inicializar tabelas

O backend roda `initDb()` no start, entao as tabelas sao criadas automaticamente quando ele conecta no MySQL.

## Observacoes importantes

- O backend usa WebSocket via Socket.IO. Render Web Services suportam WebSockets.
- Uploads usam disco persistente montado em `/var/data/uploads`.
- Para escalar para mais de uma instancia do backend, adicione Redis adapter ao Socket.IO.
