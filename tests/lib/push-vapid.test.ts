import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateVapidKeys, createVapidJWT, getVapidKeys, getVapidSubject } from "@/lib/push/vapid";

let originalPublicKey: string | undefined;
let originalPrivateKey: string | undefined;
let originalSubject: string | undefined;
before(() => {
  originalPublicKey = process.env.VAPID_PUBLIC_KEY;
  originalPrivateKey = process.env.VAPID_PRIVATE_KEY;
  originalSubject = process.env.VAPID_SUBJECT;
});

beforeEach(() => {
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_SUBJECT;
});

after(() => {
  if (originalPublicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = originalPublicKey;
  if (originalPrivateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = originalPrivateKey;
  if (originalSubject === undefined) delete process.env.VAPID_SUBJECT;
  else process.env.VAPID_SUBJECT = originalSubject;
});

describe("generateVapidKeys", () => {
  it("returns publicKey and privateKey strings", () => {
    const { publicKey, privateKey } = generateVapidKeys();
    assert.ok(typeof publicKey  === "string" && publicKey.length > 0);
    assert.ok(typeof privateKey === "string" && privateKey.length > 0);
  });

  it("publicKey is a base64url-encoded uncompressed EC point (starts with 0x04 → 65 bytes → 87 base64url chars)", () => {
    const { publicKey } = generateVapidKeys();
    const decoded = Buffer.from(publicKey, "base64url");
    assert.strictEqual(decoded.length, 65, "uncompressed EC point = 65 bytes");
    assert.strictEqual(decoded[0], 0x04,   "first byte = 0x04 (uncompressed point)");
  });

  it("privateKey is valid JSON (JWK)", () => {
    const { privateKey } = generateVapidKeys();
    assert.doesNotThrow(() => JSON.parse(privateKey));
    const jwk = JSON.parse(privateKey);
    assert.ok(jwk.d,   "JWK has d component");
    assert.ok(jwk.x,   "JWK has x component");
    assert.ok(jwk.y,   "JWK has y component");
    assert.strictEqual(jwk.crv, "P-256");
  });

  it("generates different keys each time", () => {
    const k1 = generateVapidKeys();
    const k2 = generateVapidKeys();
    assert.notStrictEqual(k1.publicKey,  k2.publicKey);
    assert.notStrictEqual(k1.privateKey, k2.privateKey);
  });
});

describe("createVapidJWT", () => {
  it("returns a 3-part JWT string", () => {
    const { privateKey } = generateVapidKeys();
    const jwt = createVapidJWT("https://fcm.googleapis.com", "mailto:test@test.com", privateKey);
    const parts = jwt.split(".");
    assert.strictEqual(parts.length, 3, "JWT has 3 parts");
  });

  it("header decodes to { alg: ES256, typ: JWT }", () => {
    const { privateKey } = generateVapidKeys();
    const jwt    = createVapidJWT("https://fcm.googleapis.com", "mailto:test@test.com", privateKey);
    const header = JSON.parse(Buffer.from(jwt.split(".")[0], "base64url").toString());
    assert.strictEqual(header.alg, "ES256");
    assert.strictEqual(header.typ, "JWT");
  });

  it("payload contains aud, sub, exp", () => {
    const { privateKey } = generateVapidKeys();
    const jwt     = createVapidJWT("https://fcm.googleapis.com", "mailto:sub@test.com", privateKey);
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    assert.strictEqual(payload.aud, "https://fcm.googleapis.com");
    assert.strictEqual(payload.sub, "mailto:sub@test.com");
    assert.ok(typeof payload.exp === "number" && payload.exp > Date.now() / 1000);
  });

  it("signature is 64 bytes (r||s each 32 bytes)", () => {
    const { privateKey } = generateVapidKeys();
    const jwt = createVapidJWT("https://fcm.googleapis.com", "mailto:test@test.com", privateKey);
    const sig = Buffer.from(jwt.split(".")[2], "base64url");
    assert.strictEqual(sig.length, 64, "ES256 raw signature = 64 bytes");
  });
});

describe("getVapidKeys", () => {
  it("fails closed when persistent keys are missing", () => {
    assert.throws(() => getVapidKeys(), /must be configured/);
  });

  it("returns a configured, valid persistent key pair", () => {
    const generated = generateVapidKeys();
    process.env.VAPID_PUBLIC_KEY = generated.publicKey;
    process.env.VAPID_PRIVATE_KEY = generated.privateKey;
    assert.deepEqual(getVapidKeys(), generated);
  });

  it("rejects malformed public and private keys", () => {
    const generated = generateVapidKeys();
    process.env.VAPID_PUBLIC_KEY = "invalid";
    process.env.VAPID_PRIVATE_KEY = generated.privateKey;
    assert.throws(() => getVapidKeys(), /PUBLIC_KEY is invalid/);

    process.env.VAPID_PUBLIC_KEY = generated.publicKey;
    process.env.VAPID_PRIVATE_KEY = "{}";
    assert.throws(() => getVapidKeys(), /PRIVATE_KEY is invalid/);
  });

  it("rejects a public key that does not match the private key", () => {
    const first = generateVapidKeys();
    const second = generateVapidKeys();
    process.env.VAPID_PUBLIC_KEY = first.publicKey;
    process.env.VAPID_PRIVATE_KEY = second.privateKey;
    assert.throws(() => getVapidKeys(), /PRIVATE_KEY is invalid/);
  });
});

describe("getVapidSubject", () => {
  it("accepts mailto and HTTPS subjects", () => {
    process.env.VAPID_SUBJECT = "mailto:notifications@example.com";
    assert.equal(getVapidSubject(), "mailto:notifications@example.com");
    process.env.VAPID_SUBJECT = "https://example.com/contact";
    assert.equal(getVapidSubject(), "https://example.com/contact");
  });

  it("rejects missing or unsupported subjects", () => {
    assert.throws(() => getVapidSubject(), /VAPID_SUBJECT/);
    process.env.VAPID_SUBJECT = "http://example.com";
    assert.throws(() => getVapidSubject(), /VAPID_SUBJECT/);
  });
});
