import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import {
  isTransactionWriteConflict,
  MAX_TRANSACTION_ATTEMPTS,
  runSerializableWithRetry,
} from "@/lib/serializable-transaction";

function driverConflict(): Error & { cause: { kind: string } } {
  return Object.assign(new Error("write conflict"), {
    cause: { kind: "TransactionWriteConflict" },
  });
}

describe("transaction conflict detection", () => {
  it("detects Prisma P2034 conflicts", () => {
    const error = new Prisma.PrismaClientKnownRequestError("conflict", {
      code: "P2034",
      clientVersion: "test",
    });
    assert.equal(isTransactionWriteConflict(error), true);
  });

  it("detects Prisma 7 driver adapter conflicts", () => {
    assert.equal(isTransactionWriteConflict(driverConflict()), true);
  });

  it("rejects unrelated and malformed errors", () => {
    assert.equal(isTransactionWriteConflict(new Error("database unavailable")), false);
    assert.equal(isTransactionWriteConflict({ cause: { kind: "Other" } }), false);
    assert.equal(isTransactionWriteConflict(null), false);
  });
});

describe("serializable transaction retry", () => {
  it("uses serializable isolation and returns the operation result", async () => {
    const transaction = { id: "tx-1" };
    let isolationLevel: unknown;
    const result = await runSerializableWithRetry(
      async (operation, options) => {
        isolationLevel = options.isolationLevel;
        return operation(transaction);
      },
      async (tx) => tx.id,
    );

    assert.equal(result, "tx-1");
    assert.equal(isolationLevel, Prisma.TransactionIsolationLevel.Serializable);
  });

  it("retries write conflicts and eventually succeeds", async () => {
    let attempts = 0;
    const result = await runSerializableWithRetry(
      async (operation) => {
        attempts += 1;
        if (attempts < MAX_TRANSACTION_ATTEMPTS) throw driverConflict();
        return operation({ value: 42 });
      },
      async (tx) => tx.value,
    );

    assert.equal(result, 42);
    assert.equal(attempts, MAX_TRANSACTION_ATTEMPTS);
  });

  it("does not retry non-conflict failures", async () => {
    const failure = new Error("connection failed");
    let attempts = 0;
    await assert.rejects(
      runSerializableWithRetry(
        async () => {
          attempts += 1;
          throw failure;
        },
        async () => "unreachable",
      ),
      (error) => error === failure,
    );
    assert.equal(attempts, 1);
  });

  it("stops after the configured conflict retry limit", async () => {
    let attempts = 0;
    await assert.rejects(
      runSerializableWithRetry(
        async () => {
          attempts += 1;
          throw driverConflict();
        },
        async () => "unreachable",
        2,
      ),
      /write conflict/,
    );
    assert.equal(attempts, 2);
  });

  it("rejects invalid retry limits before starting a transaction", async () => {
    let called = false;
    await assert.rejects(
      runSerializableWithRetry(
        async () => {
          called = true;
          return "unreachable";
        },
        async () => "unreachable",
        0,
      ),
      RangeError,
    );
    assert.equal(called, false);
  });
});
