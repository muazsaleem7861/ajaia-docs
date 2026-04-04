const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/documents - list owned + shared documents
router.get('/', (req, res) => {
  const userId = req.user.id;

  const owned = db.prepare(`
    SELECT d.*, u.name AS owner_name, 'owned' AS relation
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  const shared = db.prepare(`
    SELECT d.*, u.name AS owner_name, 'shared' AS relation, ds.permission
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    JOIN document_shares ds ON ds.document_id = d.id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  res.json({ documents: [...owned, ...shared] });
});

// GET /api/documents/:id
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const doc = db.prepare(`
    SELECT d.*, u.name AS owner_name
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === userId;
  const share = db.prepare(
    'SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(doc.id, userId);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const sharedWith = db.prepare(`
    SELECT u.id, u.email, u.name, ds.permission
    FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(doc.id);

  res.json({
    document: doc,
    isOwner,
    permission: isOwner ? 'edit' : share.permission,
    sharedWith,
  });
});

// POST /api/documents
router.post('/', (req, res) => {
  const { title = 'Untitled Document', content = '' } = req.body;
  if (!title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }
  const result = db.prepare(
    'INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)'
  ).run(title.trim(), content, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ document: doc });
});

// PATCH /api/documents/:id
router.patch('/:id', (req, res) => {
  const userId = req.user.id;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === userId;
  const share = db.prepare(
    'SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ? AND permission = ?'
  ).get(doc.id, userId, 'edit');

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'No edit permission' });
  }

  const { title, content } = req.body;
  const updates = [];
  const values = [];

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty' });
    updates.push('title = ?');
    values.push(title.trim());
  }
  if (content !== undefined) {
    updates.push('content = ?');
    values.push(content);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json({ document: updated });
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can delete' });
  }
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
