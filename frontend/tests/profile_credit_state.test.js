import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCreditSnapshot, normalizeProfileSettings } from '../src/lib/profileState.js';

test('authoritative credit normalization preserves large and zero balances', () => {
    assert.deepEqual(normalizeCreditSnapshot({ tier: 'pro', credits: 1470 }), { tier: 'Pro', credits: 1470 });
    assert.deepEqual(normalizeCreditSnapshot({ tier: 'free', credits: 0 }), { tier: 'Free', credits: 0 });
});

test('invalid credit values fail closed instead of becoming zero or a string balance', () => {
    for (const credits of [null, undefined, '1470', -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => normalizeCreditSnapshot({ credits }));
    }
});

test('malformed saved profile preferences fall back to defaults and valid keys are sanitized', () => {
    const defaults = { emailAlerts: true, dataSaver: false, ambientGlow: true, defaultSteering: 'balanced', preferredCurrency: 'INR' };
    assert.equal(normalizeProfileSettings('{bad json', defaults), defaults);
    assert.equal(normalizeProfileSettings('{"defaultSteering":"javascript:","dataSaver":"yes"}', defaults).defaultSteering, 'balanced');
    assert.equal(normalizeProfileSettings('{"defaultSteering":"accuracy","dataSaver":true}', defaults).defaultSteering, 'accuracy');
    assert.equal(normalizeProfileSettings('{"defaultSteering":"accuracy","dataSaver":true}', defaults).dataSaver, true);
});
