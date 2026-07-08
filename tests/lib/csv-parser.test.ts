/**
 * Tests for the CSV import logic (parsing inline, no HTTP).
 * Extracts the parsing helpers from the import route.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Inline the pure CSV parser (same logic as app/api/clients/import/route.ts)
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function normHeader(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
}

describe("parseCsvLine", () => {
  it("parses a simple comma-separated line", () => {
    const r = parseCsvLine("Juan,juan@mail.com,+54 11");
    assert.deepStrictEqual(r, ["Juan", "juan@mail.com", "+54 11"]);
  });

  it("handles quoted fields with commas", () => {
    const r = parseCsvLine('"Pérez, Juan",juan@mail.com,""');
    assert.deepStrictEqual(r, ["Pérez, Juan", "juan@mail.com", ""]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    const r = parseCsvLine('"He said ""hello""",email@x.com');
    assert.deepStrictEqual(r, ['He said "hello"', "email@x.com"]);
  });

  it("trims whitespace around fields", () => {
    const r = parseCsvLine("  Juan  ,  juan@mail.com  ");
    assert.deepStrictEqual(r, ["Juan", "juan@mail.com"]);
  });

  it("handles empty fields", () => {
    const r = parseCsvLine("Juan,,");
    assert.deepStrictEqual(r, ["Juan", "", ""]);
  });

  it("parses a single field", () => {
    assert.deepStrictEqual(parseCsvLine("solo"), ["solo"]);
  });
});

describe("normHeader (header normalization)", () => {
  it("lowercases", () => {
    assert.strictEqual(normHeader("Nombre"), "nombre");
  });

  it("removes accents", () => {
    assert.strictEqual(normHeader("Teléfono"), "telefono");
  });

  it("removes spaces", () => {
    assert.strictEqual(normHeader("Nombre Completo"), "nombrecompleto");
  });

  it("handles 'Email' and 'Correo'", () => {
    assert.strictEqual(normHeader("Email"),  "email");
    assert.strictEqual(normHeader("Correo"), "correo");
  });
});

describe("CSV import data validation", () => {
  const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;

  it("validates correct email addresses", () => {
    assert.ok(EMAIL_RE.test("user@gmail.com"));
    assert.ok(EMAIL_RE.test("lic.florencia@consultorio.com.ar"));
  });

  it("rejects invalid email addresses", () => {
    assert.ok(!EMAIL_RE.test("not-an-email"));
    assert.ok(!EMAIL_RE.test("missing@tld"));
    assert.ok(!EMAIL_RE.test("@nodomain.com"));
  });

  it("full CSV parse: header + 2 data rows", () => {
    const csv = [
      "Nombre,Email,Teléfono,Notas",
      "Juan Pérez,juan@mail.com,+54 11 1234-5678,Cliente frecuente",
      "Ana García,ana@mail.com,,",
    ].join("\n");

    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    assert.strictEqual(lines.length, 3);

    const headers = parseCsvLine(lines[0]).map(normHeader);
    const nameIdx  = headers.findIndex(h => h === "nombre");
    const emailIdx = headers.findIndex(h => h === "email");
    assert.ok(nameIdx  >= 0, "name column found");
    assert.ok(emailIdx >= 0, "email column found");

    const row1 = parseCsvLine(lines[1]);
    assert.strictEqual(row1[nameIdx],  "Juan Pérez");
    assert.strictEqual(row1[emailIdx], "juan@mail.com");

    const row2 = parseCsvLine(lines[2]);
    assert.strictEqual(row2[nameIdx],  "Ana García");
    assert.strictEqual(row2[emailIdx], "ana@mail.com");
  });
});
