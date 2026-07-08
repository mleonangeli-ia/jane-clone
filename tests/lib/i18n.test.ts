import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getT, LOCALES, translations } from "@/lib/i18n";

describe("getT", () => {
  it("returns Spanish translations by default", () => {
    const t = getT("es");
    assert.strictEqual(t.booking.book, "Reservar");
    assert.strictEqual(t.booking.free, "Gratis");
    assert.strictEqual(t.calendar.continue, "Continuar");
  });

  it("returns English translations", () => {
    const t = getT("en");
    assert.strictEqual(t.booking.book, "Book");
    assert.strictEqual(t.booking.free, "Free");
    assert.strictEqual(t.calendar.continue, "Continue");
  });

  it("returns Portuguese translations", () => {
    const t = getT("pt");
    assert.strictEqual(t.booking.book, "Agendar");
    assert.strictEqual(t.booking.free, "Grátis");
    assert.strictEqual(t.calendar.continue, "Continuar");
  });

  it("falls back to Spanish for unknown locale", () => {
    const t = getT("fr");
    assert.strictEqual(t.booking.book, "Reservar");
  });

  it("calendar.days has 7 entries for each locale", () => {
    for (const locale of ["es", "en", "pt"]) {
      const t = getT(locale);
      assert.strictEqual(t.calendar.days.length, 7, `days.length for ${locale}`);
    }
  });

  it("steps has 3 entries for each locale", () => {
    for (const locale of ["es", "en", "pt"]) {
      const t = getT(locale);
      assert.strictEqual(t.steps.length, 3, `steps.length for ${locale}`);
    }
  });

  it("waitlist.reasons has 3 entries in cancel", () => {
    for (const locale of ["es", "en", "pt"]) {
      const t = getT(locale);
      assert.strictEqual(t.cancel.reasons.length, 3, `cancel.reasons for ${locale}`);
    }
  });
});

describe("LOCALES", () => {
  it("has exactly 3 locales", () => {
    assert.strictEqual(LOCALES.length, 3);
  });

  it("includes es, en, pt", () => {
    const codes = LOCALES.map(l => l.code);
    assert.ok(codes.includes("es"));
    assert.ok(codes.includes("en"));
    assert.ok(codes.includes("pt"));
  });

  it("each locale has code, label and flag", () => {
    for (const loc of LOCALES) {
      assert.ok(loc.code, "code missing");
      assert.ok(loc.label, "label missing");
      assert.ok(loc.flag,  "flag missing");
    }
  });
});

describe("translations completeness", () => {
  const sections = ["booking", "calendar", "form", "steps", "success", "cancel", "waitlist"] as const;

  for (const section of sections) {
    it(`all locales have the '${section}' section`, () => {
      for (const locale of ["es", "en", "pt"]) {
        const t = getT(locale) as any;
        assert.ok(t[section], `${locale} missing ${section}`);
      }
    });
  }
});
