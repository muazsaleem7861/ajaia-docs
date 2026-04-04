const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initialize DB + seed

const authRoutes     = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const shareRoutes    = require('./routes/shares');
const uploadRoutes   = require('./routes/upload');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/shares',    shareRoutes);
app.use('/api/upload',    uploadRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
