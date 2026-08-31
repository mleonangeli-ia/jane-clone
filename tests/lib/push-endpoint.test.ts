import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafePushEndpoint, validatePushEndpoint } from '@/lib/push/endpoint';

describe('Web Push endpoint SSRF protection', () => {
  it('accepts HTTPS endpoints from supported push providers', () => {
    const endpoints = [
      'https://fcm.googleapis.com/fcm/send/subscription-token',
      'https://updates.push.services.mozilla.com/wpush/v2/token',
      'https://web.push.apple.com/QE-token',
      'https://cloud.notify.windows.com/?token=value',
    ];

    for (const endpoint of endpoints) assert.ok(validatePushEndpoint(endpoint));
  });

  it('rejects unsupported hosts, lookalikes and non-HTTPS protocols', () => {
    const endpoints = [
      'http://fcm.googleapis.com/fcm/send/token',
      'https://fcm.googleapis.com.attacker.example/token',
      'https://attacker.example/fcm.googleapis.com/token',
      'https://localhost/internal',
      'https://127.0.0.1/internal',
      'file:///etc/passwd',
    ];

    for (const endpoint of endpoints) assert.equal(validatePushEndpoint(endpoint), null);
  });

  it('rejects credentials and non-standard ports', () => {
    assert.equal(validatePushEndpoint('https://user:pass@fcm.googleapis.com/token'), null);
    assert.equal(validatePushEndpoint('https://fcm.googleapis.com:8443/token'), null);
  });

  it('rejects allowed hosts that resolve to private or metadata networks', async () => {
    const privateResolver = async () => [{ address: '10.0.0.5', family: 4 }];
    const metadataResolver = async () => [{ address: '169.254.169.254', family: 4 }];

    await assert.rejects(
      assertSafePushEndpoint('https://fcm.googleapis.com/token', privateResolver),
      /blocked network/,
    );
    await assert.rejects(
      assertSafePushEndpoint('https://fcm.googleapis.com/token', metadataResolver),
      /blocked network/,
    );
  });

  it('rejects mixed public and private DNS answers to resist rebinding', async () => {
    const rebindingResolver = async () => [
      { address: '142.250.64.106', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ];

    await assert.rejects(
      assertSafePushEndpoint('https://fcm.googleapis.com/token', rebindingResolver),
      /blocked network/,
    );
  });

  it('rejects IPv4-mapped IPv6 answers', async () => {
    const mappedResolver = async () => [{ address: '::ffff:127.0.0.1', family: 6 }];

    await assert.rejects(
      assertSafePushEndpoint('https://fcm.googleapis.com/token', mappedResolver),
      /blocked network/,
    );
  });

  it('accepts an allowlisted host only when every address is public', async () => {
    const publicResolver = async () => [
      { address: '142.250.64.106', family: 4 },
      { address: '2607:f8b0:4005:805::200a', family: 6 },
    ];

    const url = await assertSafePushEndpoint(
      'https://fcm.googleapis.com/fcm/send/token',
      publicResolver,
    );
    assert.equal(url.origin, 'https://fcm.googleapis.com');
  });
});
