import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { encryptPem, decryptPem, buildAfipQR } from "@/lib/afip/crypto";

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-32-bytes-minimum-ok!";
});

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJ4Z...fakecertdata...
-----END CERTIFICATE-----`;

describe("encryptPem / decryptPem", () => {
  it("decrypts to the original PEM", () => {
    const encrypted = encryptPem(SAMPLE_PEM);
    const decrypted = decryptPem(encrypted);
    assert.strictEqual(decrypted, SAMPLE_PEM);
  });

  it("produces different ciphertext on each call (random IV)", () => {
    const e1 = encryptPem(SAMPLE_PEM);
    const e2 = encryptPem(SAMPLE_PEM);
    assert.notStrictEqual(e1, e2);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptPem(SAMPLE_PEM);
    const parts = encrypted.split(":");
    parts[2] = "ff".repeat(parts[2].length / 2); // corrupt ciphertext
    assert.throws(() => decryptPem(parts.join(":")));
  });

  it("handles empty string PEM", () => {
    const encrypted = encryptPem("");
    const decrypted = decryptPem(encrypted);
    assert.strictEqual(decrypted, "");
  });
});

describe("buildAfipQR", () => {
  it("returns a URL starting with afip.gob.ar", () => {
    const url = buildAfipQR({
      ver: 1,
      fecha: "2026-01-15",
      cuit: 20123456789,
      ptoVta: 1,
      tipoCmp: 11,
      nroCmp: 42,
      importe: 5000,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: 99,
      nroDocRec: 0,
      tipoCodAut: "E",
      codAut: 12345678901234,
    });
    assert.ok(url.startsWith("https://www.afip.gob.ar/fe/qr/?p="));
  });

  it("encodes the data as base64url", () => {
    const url = buildAfipQR({
      ver: 1, fecha: "2026-01-15", cuit: 20123456789,
      ptoVta: 1, tipoCmp: 11, nroCmp: 1, importe: 100,
      moneda: "PES", ctz: 1, tipoDocRec: 99, nroDocRec: 0,
      tipoCodAut: "E", codAut: 99999,
    });
    const param = new URL(url).searchParams.get("p")!;
    const decoded = JSON.parse(Buffer.from(param, "base64url").toString());
    assert.strictEqual(decoded.ptoVta, 1);
    assert.strictEqual(decoded.importe, 100);
  });
});
