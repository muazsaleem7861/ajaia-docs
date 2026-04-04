const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/shares - share a document with a user
router.post('/', (req, res) => {
  const { documentId, sharedWithEmail, permission = 'edit' } = req.body;

  if (!documentId || !sharedWithEmail) {
    return res.status(400).json({ error: 'documentId and sharedWithEmail are required' });
  }
  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be view or edit' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can share this document' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(sharedWithEmail);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot share with yourself' });
  }

  try {
    db.prepare(`
      INSERT INTO document_shares (document_id, shared_with_id, permission)
      VALUES (?, ?, ?)
      ON CONFLICT(document_id, shared_with_id) DO UPDATE SET permission = excluded.permission
    `).run(documentId, targetUser.id, permission);

    res.json({ success: true, sharedWith: { id: targetUser.id, name: targetUser.name, email: targetUser.email, permission } });
  } catch {
    res.status(500).json({ error: 'Failed to share document' });
  }
});

// DELETE /api/shares - revoke share
router.delete('/', (req, res) => {
  const { documentId, sharedWithId } = req.body;
  if (!documentId || !sharedWithId) {
    return res.status(400).json({ error: 'documentId and sharedWithId are required' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the owner can revoke access' });
  }

  db.prepare(
    'DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).run(documentId, sharedWithId);

  res.json({ success: true });
});

module.exports = router;
