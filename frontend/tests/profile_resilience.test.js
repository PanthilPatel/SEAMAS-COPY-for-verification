import test from 'node:test';
import assert from 'node:assert/strict';
import { settleWithin } from '../src/lib/async.js';

test('profile request helper returns completed API data', async () => {
    assert.deepEqual(await settleWithin(Promise.resolve({ data: { credits: 20 } }), 100, 'Credits'), { data: { credits: 20 } });
});

test('profile request helper propagates API failures', async () => {
    await assert.rejects(settleWithin(Promise.reject(new Error('expired session')), 100, 'Session'), /expired session/);
});

test('profile request helper bounds stalled API calls', async () => {
    await assert.rejects(settleWithin(new Promise(() => {}), 5, 'Credits'), /Credits timed out/);
});
