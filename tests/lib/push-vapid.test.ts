import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { generateVapidKeys, createVapidJWT, getVapidKeys } from "@/lib/push/vapid";

before(() => {
  // Clear env to force ephemeral key generation
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
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
  it("returns ephemeral keys when env vars are not set", () => {
    const { publicKey, privateKey } = getVapidKeys();
    assert.ok(publicKey.length  > 0);
    assert.ok(privateKey.length > 0);
  });

  it("returns the same ephemeral keys on successive calls (cached)", () => {
    const k1 = getVapidKeys();
    const k2 = getVapidKeys();
    assert.strictEqual(k1.publicKey,  k2.publicKey);
    assert.strictEqual(k1.privateKey, k2.privateKey);
  });
});
