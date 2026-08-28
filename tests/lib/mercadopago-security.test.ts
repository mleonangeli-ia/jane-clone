import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  getSafeMercadoPagoCheckoutUrl,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago-security";

describe("MercadoPago checkout URL allowlist", () => {
  for (const host of [
    "www.mercadopago.com",
    "www.mercadopago.com.ar",
    "sandbox.mercadopago.com",
    "sandbox.mercadopago.com.ar",
  ]) {
    it(`accepts HTTPS checkout URLs on ${host}`, () => {
      assert.equal(
        getSafeMercadoPagoCheckoutUrl(`https://${host}/checkout/v1/redirect?pref_id=123`),
        `https://${host}/checkout/v1/redirect?pref_id=123`,
      );
    });
  }

  it("rejects non-HTTPS and relative URLs", () => {
    assert.equal(getSafeMercadoPagoCheckoutUrl("http://www.mercadopago.com/checkout"), null);
    assert.equal(getSafeMercadoPagoCheckoutUrl("/checkout"), null);
  });

  it("rejects lookalike, subdomain, and suffix-confusion hosts", () => {
    assert.equal(getSafeMercadoPagoCheckoutUrl("https://mercadopago.example/checkout"), null);
    assert.equal(getSafeMercadoPagoCheckoutUrl("https://evil.www.mercadopago.com/checkout"), null);
    assert.equal(getSafeMercadoPagoCheckoutUrl("https://www.mercadopago.com.evil.test/checkout"), null);
  });

  it("rejects malformed and non-string values", () => {
    assert.equal(getSafeMercadoPagoCheckoutUrl("not a URL"), null);
    assert.equal(getSafeMercadoPagoCheckoutUrl(undefined), null);
    assert.equal(getSafeMercadoPagoCheckoutUrl({ url: "https://www.mercadopago.com" }), null);
  });
});

describe("MercadoPago webhook signature", () => {
  const secret = "webhook-secret-for-tests";
  const dataId = "payment-123";
  const requestId = "request-456";
  const timestamp = "1787832000";
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const hash = createHmac("sha256", secret).update(manifest).digest("hex");

  it("accepts a valid signature regardless of field order", () => {
    assert.equal(
      verifyMercadoPagoSignature({
        secret,
        signatureHeader: `v1=${hash},ts=${timestamp}`,
        requestId,
        dataId,
      }),
      true,
    );
  });

  it("fails closed when the secret or required request metadata is missing", () => {
    const valid = { signatureHeader: `ts=${timestamp},v1=${hash}`, requestId, dataId };
    assert.equal(verifyMercadoPagoSignature({ secret: undefined, ...valid }), false);
    assert.equal(verifyMercadoPagoSignature({ secret, ...valid, signatureHeader: null }), false);
    assert.equal(verifyMercadoPagoSignature({ secret, ...valid, requestId: null }), false);
    assert.equal(verifyMercadoPagoSignature({ secret, ...valid, dataId: null }), false);
  });

  it("rejects signatures when any signed field is changed", () => {
    const signatureHeader = `ts=${timestamp},v1=${hash}`;
    assert.equal(verifyMercadoPagoSignature({ secret, signatureHeader, requestId, dataId: "other" }), false);
    assert.equal(verifyMercadoPagoSignature({ secret, signatureHeader, requestId: "other", dataId }), false);
    assert.equal(
      verifyMercadoPagoSignature({
        secret,
        signatureHeader: `ts=1787832001,v1=${hash}`,
        requestId,
        dataId,
      }),
      false,
    );
  });

  it("rejects malformed, truncated, and non-hex signatures without throwing", () => {
    for (const signatureHeader of [
      "invalid",
      `ts=${timestamp}`,
      `v1=${hash}`,
      `ts=${timestamp},v1=abc`,
      `ts=${timestamp},v1=${"z".repeat(64)}`,
    ]) {
      assert.doesNotThrow(() => {
        assert.equal(
          verifyMercadoPagoSignature({ secret, signatureHeader, requestId, dataId }),
          false,
        );
      });
    }
  });
});
