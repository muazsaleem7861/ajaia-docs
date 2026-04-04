# Architecture Note

## What I built and why

### Stack choices

**SQLite over Postgres/Supabase**
SQLite with `better-sqlite3` requires zero external services — reviewers can run the project with a single `npm install && npm run dev`. For a solo-user-to-small-team collaborative tool at this scope, SQLite is adequate and dramatically reduces setup friction. I'd swap to Postgres on Railway or Supabase when moving to multi-instance production.

**TipTap over Quill, ProseMirror raw, or Draft.js**
TipTap is ProseMirror under the hood (battle-tested), has a clean React hook API (`useEditor`), and ships all required extensions (Bold, Italic, Underline, Headings, Lists, History) in one package. Quill has known React 18 compatibility issues. Building raw ProseMirror would take 2–3× longer.

**JWT + seeded users over OAuth or a full auth flow**
The assignment asks to "simulate users with seeded accounts or mocked auth." Full OAuth would burn 45–60 minutes. Three seeded users with JWT covers all sharing flows the reviewers need to evaluate.

**React + Vite over Next.js**
No SSR requirement here. Vite is faster to scaffold and the SPA model is simpler to reason about within a time-boxed build. I used React Router for client-side routing.

---

## Data model

```
users
  id, email, password (bcrypt), name, created_at

documents
  id, title, content (HTML string), owner_id, created_at, updated_at

document_shares
  id, document_id, shared_with_id, permission ('view' | 'edit')
  UNIQUE(document_id, shared_with_id)
```

Content is stored as TipTap's HTML output — a stable, human-readable string that survives re-loads without a custom serializer.

---

## What I prioritized

1. **Editing experience** — TipTap with a clean toolbar (Bold, Italic, Underline, H1–H3, lists, undo/redo) and 1.5s debounced autosave. The editor had to feel usable, not just functional.

2. **Sharing model clarity** — Owned vs shared documents are visually distinct on the dashboard (indigo vs amber badges). The share modal shows who has access, their permission level, and lets the owner revoke access. This felt more important than, say, real-time sync.

3. **File import** — `.txt`, `.md`, `.docx` all convert to new editable documents. `.docx` uses `mammoth` for HTML conversion.

4. **Persistence** — SQLite WAL mode for better concurrent reads. Documents persist across restarts. Shared access is stored relationally and enforced server-side.

---

## What I deliberately cut

- **Real-time collaboration (WebSockets)** — Would require Socket.io + operational transforms or CRDT (Yjs). Estimated 3–5 hours extra. The autosave model gives "eventually consistent" edits, which is sufficient for the demo.
- **Export to PDF** — Stretch goal; deprioritized in favor of making the core editor feel solid.
- **Role-based permissions beyond view/edit** — The model supports it (the `permission` field is a string), but I only expose `view` and `edit` in the UI.
- **Email notifications** — Out of scope for a local-first demo.

---

## If I had 2–4 more hours

1. Real-time presence indicators using Socket.io (broadcast cursor positions)
2. Document version history (store content snapshots on save)
3. Export to Markdown (TipTap has a first-class markdown serializer)
4. Swap SQLite for Supabase Postgres to enable horizontal scaling

---

## API surface

```
POST   /api/auth/login              → JWT
GET    /api/auth/me                 → current user
GET    /api/auth/users              → user list (for share UI)

GET    /api/documents               → owned + shared docs
POST   /api/documents               → create
GET    /api/documents/:id           → fetch with access check
PATCH  /api/documents/:id           → update title/content
DELETE /api/documents/:id           → owner only

POST   /api/shares                  → share (upsert)
DELETE /api/shares                  → revoke

POST   /api/upload                  → multipart, returns new document
```

All write endpoints enforce JWT auth middleware. Document access checks run per-request against the `document_shares` table.
