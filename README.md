# PrivyChat

PrivyChat e um app mobile first de chat privado em tempo real com React, Vite, TailwindCSS, Framer Motion, Node.js, Express, Socket.IO, JWT, OAuth Google e MySQL.

## Stack

- Frontend: React + Vite, TailwindCSS, Framer Motion, React Router DOM, Zustand, Axios e PWA.
- Backend: Node.js + Express, JWT + refresh token, Google OAuth login, Socket.IO, Helmet, CORS, rate limiting, bcrypt, validacao e sanitizacao.
- Banco: MySQL Server administrado pelo MySQL Workbench 8.0 CE.

## Estrutura

```text
frontend/
  src/components
  src/pages
  src/layouts
  src/services
  src/store
  src/hooks
  src/styles
backend/
  controllers
  routes
  middlewares
  models
  sockets
  config
  utils
  database
  scripts
```

## Rodando com MySQL Workbench 8.0 CE

O MySQL Workbench nao e o banco de dados; ele e a ferramenta visual. O banco usado pelo PrivyChat continua sendo o MySQL Server que o Workbench acessa.

1. Abra o MySQL Workbench 8.0 CE.
2. Entre na sua conexao local, normalmente `Local instance MySQL80`.
3. Confirme o usuario e senha usados na conexao. Geralmente o usuario e `root`.
4. Abra o arquivo:

```text
backend/database/workbench-setup.sql
```

5. Execute o script inteiro no Workbench usando o botao de raio.
6. Confira no painel `Schemas` se apareceu o banco `privychat`.

## Arquivos .env

No Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Edite `backend/.env` com a senha que voce usa no MySQL Workbench:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua-senha-do-mysql
DB_NAME=privychat
```

Se seu Workbench usa outro usuario, coloque esse usuario em `DB_USER`.

## Instalacao

```bash
npm run install:all
```

## Inicializar banco pelo terminal

Depois de configurar `backend/.env`, voce tambem pode inicializar o banco pelo terminal:

```bash
npm --prefix backend run db:init
```

Se aparecer `Access denied for user 'root'@'localhost'`, a senha em `backend/.env` nao e a mesma da conexao do MySQL Workbench.

## Rodar em desenvolvimento

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

Tambem pode rodar separado:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

## Google OAuth

Configure um OAuth Client ID no Google Cloud Console, adicione o dominio do frontend autorizado e coloque o valor em:

- `frontend/.env`: `VITE_GOOGLE_CLIENT_ID`
- `backend/.env`: `GOOGLE_CLIENT_ID`

O endpoint `/api/auth/google-login` valida o `id_token` usando `https://oauth2.googleapis.com/tokeninfo`.

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google-login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Usuarios

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/update`

### Conversas

- `GET /api/conversations`
- `POST /api/conversations/create`

### Mensagens

- `GET /api/messages/:conversationId`
- `POST /api/messages/send`

## Tempo real

Socket.IO cobre:

- mensagens instantaneas
- presenca online/offline
- status digitando
- confirmacao de entrega
- salas por conversa

## Seguranca

- Senhas com bcrypt.
- Access token curto e refresh token em cookie `httpOnly`.
- Hash dos refresh tokens persistidos em `sessions`.
- Helmet, CORS restrito, rate limit e validacao com `express-validator`.
- Sanitizacao com `xss`.
- Mensagens criptografadas com AES-256-GCM antes da gravacao no MySQL.

## Troubleshooting

Erro: `Access denied for user 'root'@'localhost'`

- Abra o MySQL Workbench.
- Teste a conexao local.
- Use a mesma senha em `backend/.env`.
- Rode de novo `npm --prefix backend run db:init`.

Erro: `ECONNREFUSED localhost:3306`

- O MySQL Server nao esta iniciado.
- No Windows, abra `Services` e inicie `MySQL80`, ou use o MySQL Installer.

Erro: frontend abre, mas login/cadastro falha

- Confirme se o backend esta rodando em `http://localhost:5000`.
- Confirme se `backend/.env` aponta para o banco correto.
- Confirme se o schema `privychat` existe no Workbench.

## Deploy

- Build do frontend: `npm --prefix frontend run build`.
- Start do backend: `npm --prefix backend start`.
- Em producao, defina `NODE_ENV=production`, `CLIENT_URL` com o dominio real, segredos fortes e HTTPS para cookies seguros.
