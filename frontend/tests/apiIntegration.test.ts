import test from 'node:test';
import assert from 'node:assert/strict';
import {
  API_BASE_URL,
  resolveApiBaseUrl,
  resolveRealtimeStreamUrl,
  getActiveBearerToken,
  setInMemoryAuthToken,
  registerAuthTokenGetter,
} from '../src/services/api.ts';

test('1. resolveApiBaseUrl defaults to port 8001 and normalizes /api/v1 prefix', () => {
  assert.equal(resolveApiBaseUrl(''), 'http://127.0.0.1:8001/api/v1');
  assert.equal(resolveApiBaseUrl(undefined), 'http://127.0.0.1:8001/api/v1');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:8001'), 'http://127.0.0.1:8001/api/v1');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:8001/'), 'http://127.0.0.1:8001/api/v1');
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:8001/api/v1'), 'http://127.0.0.1:8001/api/v1');
  assert.equal(resolveApiBaseUrl('https://aqs-prod.sode-edu.in'), 'https://aqs-prod.sode-edu.in/api/v1');
});

test('2. API_BASE_URL and resolveRealtimeStreamUrl stay synchronized on same base', () => {
  assert.match(API_BASE_URL, /:8001\/api\/v1$/);
  assert.equal(resolveRealtimeStreamUrl(), `${API_BASE_URL}/realtime/stream`);
  assert.equal(
    resolveRealtimeStreamUrl('http://127.0.0.1:8001/api/v1'),
    'http://127.0.0.1:8001/api/v1/realtime/stream'
  );
});

test('3. Token getter attaches live token and clears cleanly', async () => {
  setInMemoryAuthToken(null);
  registerAuthTokenGetter(null);

  assert.equal(await getActiveBearerToken(), null);

  setInMemoryAuthToken('static-token-123');
  assert.equal(await getActiveBearerToken(), 'static-token-123');

  registerAuthTokenGetter(async () => 'dynamic-live-token-456');
  assert.equal(await getActiveBearerToken(), 'dynamic-live-token-456');

  // Cleanup
  registerAuthTokenGetter(null);
  setInMemoryAuthToken(null);
  assert.equal(await getActiveBearerToken(), null);
});
