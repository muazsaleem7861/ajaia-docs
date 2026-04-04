const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use an in-memory test database
process.env.DB_PATH = path.join(__dirname, 'test.sqlite');

const app = require('../index');
const db  = require('../db');

let tokenAlice, tokenBob, aliceId, bobId, docId;

beforeAll(() => {
  const alice = db.prepare('SELECT * FROM users WHERE email = ?').get('alice@ajaia.com');
  const bob   = db.prepare('SELECT * FROM users WHERE email = ?').get('bob@ajaia.com');
  aliceId = alice.id;
  bobId   = bob.id;
});

afterAll(() => {
  try { db.close(); } catch {}
  const p = process.env.DB_PATH;
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

describe('Auth', () => {
  test('login with valid credentials returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    tokenAlice = res.body.token;
  });

  test('login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('login as bob', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@ajaia.com', password: 'password123' });
    expect(res.status).toBe(200);
    tokenBob = res.body.token;
  });
});

describe('Documents', () => {
  test('create a document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: 'Test Doc', content: '<p>Hello</p>' });
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe('Test Doc');
    docId = res.body.document.id;
  });

  test('list documents includes created doc', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${tokenAlice}`);
    expect(res.status).toBe(200);
    expect(res.body.documents.some(d => d.id === docId)).toBe(true);
  });

  test('bob cannot access alice document before sharing', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(403);
  });

  test('update document title', async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe('Updated Title');
  });
});

describe('Sharing', () => {
  test('alice shares document with bob', async () => {
    const res = await request(app)
      .post('/api/shares')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ documentId: docId, sharedWithEmail: 'bob@ajaia.com', permission: 'edit' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('bob can now access the document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(200);
    expect(res.body.isOwner).toBe(false);
    expect(res.body.permission).toBe('edit');
  });

  test('alice revokes bobs access', async () => {
    await request(app)
      .delete('/api/shares')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ documentId: docId, sharedWithId: bobId });

    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenBob}`);
    expect(res.status).toBe(403);
  });
});

describe('Validation', () => {
  test('cannot create document with empty title', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });
});
