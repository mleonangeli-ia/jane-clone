/**
 * Unit tests for clinical note field validation logic.
 * Tests the same rules enforced in /api/appointments/[id]/notes PUT route.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const MAX_FIELD = 5000;

function validateNoteField(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null; // allowed (clears field)
  if (typeof value !== "string") return `'${field}' must be a string`;
  if (value.length > MAX_FIELD) return `'${field}' exceeds max (${MAX_FIELD} chars)`;
  return null;
}

function validateSoapNote(note: Record<string, unknown>): string | null {
  for (const field of ["subjective", "objective", "assessment", "plan"]) {
    const err = validateNoteField(field, note[field]);
    if (err) return err;
  }
  return null;
}

describe("SOAP note field validation", () => {
  it("accepts all null fields (empty note)", () => {
    const err = validateSoapNote({ subjective: null, objective: null, assessment: null, plan: null });
    assert.strictEqual(err, null);
  });

  it("accepts empty strings (clears field text)", () => {
    const err = validateSoapNote({ subjective: "", objective: "", assessment: "", plan: "" });
    assert.strictEqual(err, null);
  });

  it("accepts text up to 5000 chars per field", () => {
    const longText = "A".repeat(MAX_FIELD);
    const err = validateSoapNote({
      subjective: longText,
      objective:  longText,
      assessment: longText,
      plan:       longText,
    });
    assert.strictEqual(err, null);
  });

  it("rejects text over 5000 chars in subjective", () => {
    const err = validateSoapNote({ subjective: "A".repeat(MAX_FIELD + 1) });
    assert.ok(err !== null, "expected validation error");
    assert.ok(err!.includes("subjective"), `expected error to mention 'subjective', got: ${err}`);
  });

  it("rejects text over 5000 chars in objective", () => {
    const err = validateSoapNote({ objective: "B".repeat(MAX_FIELD + 1) });
    assert.ok(err !== null);
    assert.ok(err!.includes("objective"));
  });

  it("rejects text over 5000 chars in assessment", () => {
    const err = validateSoapNote({ assessment: "C".repeat(MAX_FIELD + 1) });
    assert.ok(err !== null);
    assert.ok(err!.includes("assessment"));
  });

  it("rejects text over 5000 chars in plan", () => {
    const err = validateSoapNote({ plan: "D".repeat(MAX_FIELD + 1) });
    assert.ok(err !== null);
    assert.ok(err!.includes("plan"));
  });

  it("accepts a realistic clinical note", () => {
    const err = validateSoapNote({
      subjective:  "Paciente refiere dolor lumbar de 3 días de evolución, 7/10 de intensidad.",
      objective:   "Contractura paravertebral bilateral. Arcos de movimiento limitados. No signos neurológicos.",
      assessment:  "Lumbalgia aguda sin compromiso radicular.",
      plan:        "AINE 5 días, calor local, reposo relativo 48hs. Control en 1 semana.",
    });
    assert.strictEqual(err, null);
  });

  it("accepts partial note (only some SOAP fields filled)", () => {
    const err = validateSoapNote({
      subjective: "Cefalea tensional",
      plan:       "Ibuprofeno 400mg c/8hs por 3 días",
    });
    assert.strictEqual(err, null);
  });

  it("accepts Unicode and special characters in notes", () => {
    const err = validateSoapNote({
      subjective: "Paciente refiere ↑ dolor, °C temperatura, % saturación O₂",
      plan:       "Derivar a especialista — urgente ⚠️",
    });
    assert.strictEqual(err, null);
  });
});

describe("Note field type validation", () => {
  it("null is valid (clears the field)", () => {
    const err = validateNoteField("subjective", null);
    assert.strictEqual(err, null);
  });

  it("undefined is valid (field not provided)", () => {
    const err = validateNoteField("plan", undefined);
    assert.strictEqual(err, null);
  });

  it("number is invalid", () => {
    const err = validateNoteField("subjective", 42);
    assert.ok(err !== null);
    assert.ok(err!.includes("string"));
  });

  it("array is invalid", () => {
    const err = validateNoteField("plan", ["item1", "item2"]);
    assert.ok(err !== null);
    assert.ok(err!.includes("string"));
  });

  it("object is invalid", () => {
    const err = validateNoteField("objective", { text: "hello" });
    assert.ok(err !== null);
    assert.ok(err!.includes("string"));
  });

  it("boolean is invalid", () => {
    const err = validateNoteField("assessment", true);
    assert.ok(err !== null);
    assert.ok(err!.includes("string"));
  });
});
