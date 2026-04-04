# SUBMISSION.md

## What's included

| Item | Status |
|---|---|
| Source code (server + client) | ✅ |
| README.md with local setup instructions | ✅ |
| ARCHITECTURE.md — decisions, tradeoffs, data model | ✅ |
| AI_WORKFLOW.md — tools, rejections, verification | ✅ |
| Automated tests (Jest + Supertest) | ✅ |
| Live deployment URL | ✅ *(see below)* |
| Walkthrough video | ✅ *(see below)* |

---

## Live deployment

**App URL:** `https://ajaia-docs.vercel.app` *(replace with actual)*

**Test credentials:**
| User | Email | Password |
|---|---|---|
| Alice | alice@ajaia.com | password123 |
| Bob | bob@ajaia.com | password123 |
| Carol | carol@ajaia.com | password123 |

---

## Walkthrough video

`https://loom.com/share/YOUR_LOOM_ID` *(replace with actual)*

Video covers:
- Login flow and dashboard
- Creating a document and editing with rich text
- Renaming a document inline
- Importing a `.txt` / `.docx` file
- Sharing a document with another user and setting permissions
- Logging in as the second user to verify shared access
- Revoking access and verifying 403
- Autosave behavior
- What was intentionally deprioritized

---

## What's working

- User login with JWT
- Document creation, editing (TipTap rich text), and autosave
- Inline document rename
- File import: `.txt`, `.md`, `.docx`
- Sharing with view/edit permission
- Access revocation
- Dashboard with owned vs shared distinction
- View-only mode enforcement
- Automated test suite (12 tests)

## What's incomplete / next steps

- Real-time collaboration (WebSockets + Yjs) — largest omitted feature
- Document version history
- Export to Markdown/PDF
- Email notifications on share
- Full RBAC (owner / editor / commenter / viewer roles)

---

## Local run (quick version)

```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev

# Open http://localhost:5173
```
