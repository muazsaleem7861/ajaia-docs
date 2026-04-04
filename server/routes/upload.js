const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const ALLOWED_TYPES = ['.txt', '.md', '.docx'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_TYPES.includes(ext)) cb(null, true);
    else cb(new Error(`Only ${ALLOWED_TYPES.join(', ')} files are supported`));
  },
});

// POST /api/upload - upload a file and create a new document from it
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const title = path.basename(req.file.originalname, ext);
  let content = '';

  try {
    if (ext === '.txt' || ext === '.md') {
      content = fs.readFileSync(req.file.path, 'utf-8');
      // Wrap plain text in basic HTML for the editor
      if (ext === '.txt') {
        content = '<p>' + content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
      } else {
        // For .md, do a basic conversion
        content = '<p>' + content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
      }
    } else if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.convertToHtml({ path: req.file.path });
      content = result.value;
    }

    const result = db.prepare(
      'INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)'
    ).run(title, content, req.user.id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ document: doc, message: `Imported from ${req.file.originalname}` });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
  }
  res.status(400).json({ error: err.message });
});

module.exports = router;
