# Ajaia Docs

A lightweight collaborative document editor. Create, edit, and share rich-text documents — inspired by Google Docs, scoped for a 4–6 hour build.

**Live demo:** `https://ajaia-docs.vercel.app` *(replace with your deployed URL)*

---

## Demo accounts

All passwords are `password123`.

| Name | Email |
|---|---|
| Alice Johnson | alice@ajaia.com |
| Bob Smith | bob@ajaia.com |
| Carol White | carol@ajaia.com |

---

## Local setup

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd ajaia-docs
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

The server starts on **http://localhost:3001**. It auto-creates `database.sqlite` and seeds the three demo users on first run.

### 3. Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

### 4. Run tests

```bash
cd server
npm test
```

---

## Supported file imports

| Type | Behavior |
|---|---|
| `.txt` | Converted to paragraphs, opened as a new document |
| `.md` | Treated as plain text, opened as a new document |
| `.docx` | Converted to HTML via `mammoth`, opened as a new document |

Max file size: **5 MB**

---

## Environment variables

### Server (`server/.env`)

```env
PORT=3001
JWT_SECRET=your-secret-here
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

For production, set `VITE_API_URL` to your deployed server URL.

---

## Deployment

**Backend** → [Railway](https://railway.app) or [Render](https://render.com)
- Set `PORT`, `JWT_SECRET`, `CLIENT_URL` as env vars
- Start command: `node index.js`

**Frontend** → [Vercel](https://vercel.com)
- Root: `client/`
- Build: `npm run build`
- Output: `dist/`
- Set `VITE_API_URL` env var to your backend URL

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TipTap 2, Tailwind CSS 3 |
| Backend | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcrypt |
| File upload | Multer + mammoth (.docx parsing) |
| Testing | Jest + Supertest |
