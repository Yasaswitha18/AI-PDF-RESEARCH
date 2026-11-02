import test from 'node:test';
import assert from 'node:assert';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../server.js');

// Helper to make local HTTP requests to the running express app
let serverInstance;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
    // Start server on an ephemeral port
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    serverInstance.close(resolve);
  });
});

test('GET /api/health - Returns healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.ok(data.timestamp);
});

test('GET /api/pdf/status - Returns initial empty document status', async () => {
  const res = await fetch(`${baseUrl}/api/pdf/status`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.hasDocument, false);
});

test('POST /api/chat - Validates missing question', async () => {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes('question'));
});

test('POST /api/pdf/search - Validates missing keyword', async () => {
  const res = await fetch(`${baseUrl}/api/pdf/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes('keyword'));
});

test('DELETE /api/pdf - Clears active document successfully', async () => {
  const res = await fetch(`${baseUrl}/api/pdf`, {
    method: 'DELETE',
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
});
