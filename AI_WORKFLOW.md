# AI Workflow Note

## Tools used

- **Claude (Sonnet)** — primary tool for scaffolding, code generation, and architecture reasoning
- **GitHub Copilot** — inline completions during editor/component work

---

## Where AI materially sped up my work

**1. Boilerplate elimination**
The Express route stubs, SQLite table definitions, and JWT middleware were generated in one prompt. I gave Claude the data model and it produced ~80% of the server code in under 2 minutes. Without AI, this would have taken 25–35 minutes of typing and looking up syntax.

**2. TipTap toolbar**
I prompted: "Write a TipTap 2 toolbar component in React with Bold, Italic, Underline, H1/H2/H3, bullet list, ordered list, undo/redo." The output was immediately usable with minor styling tweaks.

**3. Multer + mammoth integration**
I'd used Multer before but not with mammoth. Prompted Claude to write a file upload route that accepts `.txt`, `.md`, `.docx`, converts each to HTML, and returns a new document. The output worked with one fix (missing error cleanup for temp files).

**4. Test scaffolding**
The Jest + Supertest test file structure was AI-generated from a prompt describing the flows I wanted to cover. I added two additional edge case tests manually.

---

## What I changed or rejected

**Rejected — overcomplicated auth flow**
The first auth implementation Claude generated included refresh tokens, a blacklist table, and Redis integration. I rejected this entirely and simplified to stateless JWT with 7-day expiry — appropriate for the scope.

**Changed — share modal UX**
The first draft rendered the people-with-access list inside the form, which made the layout feel cramped. I restructured it so the list appears below the form, with proper spacing and a "Demo users" hint.

**Changed — autosave debounce**
The generated autosave used a 3-second debounce. I reduced it to 1.5 seconds — fast enough to feel responsive but not so aggressive it hammers the server on every keystroke.

**Changed — error handling in upload route**
The generated code didn't clean up the temp file when mammoth threw. I added `finally`-style cleanup and a proper multer error handler middleware.

**Rejected — CSS modules**
First scaffold used CSS Modules. I switched to Tailwind because it's faster to iterate in a time-boxed build and the output is easier for reviewers to scan.

---

## How I verified correctness

- **Ran the test suite** after every significant backend change (`npm test`)
- **Manually tested each user flow**: login as Alice → create doc → share with Bob → log in as Bob → verify access → log in as Alice → revoke → verify 403
- **Tested file upload** with all three supported types and one unsupported type to confirm the error message renders
- **Checked persistence** by creating a document, killing the server, restarting, and confirming the document was still there
- **Reviewed generated SQL queries** for injection risk — all use parameterized statements via better-sqlite3's prepared statement API

---

## Philosophy

I used AI to eliminate mechanical work (boilerplate, schema definitions, test setup) so I could spend more time on the parts that require judgment: the sharing UX, the editor experience, and what to cut. I reviewed every generated block before committing it, and didn't ship anything I didn't understand.
