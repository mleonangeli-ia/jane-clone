import { Prisma } from "@prisma/client";

export const MAX_TRANSACTION_ATTEMPTS = 3;

type TransactionRunner<TTransaction> = <TResult>(
  operation: (transaction: TTransaction) => Promise<TResult>,
  options: { isolationLevel: typeof Prisma.TransactionIsolationLevel.Serializable },
) => Promise<TResult>;

export function isTransactionWriteConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return true;
  }
  if (!error || typeof error !== "object" || !("cause" in error)) return false;
  const cause = error.cause;
  return Boolean(
    cause &&
      typeof cause === "object" &&
      "kind" in cause &&
      cause.kind === "TransactionWriteConflict",
  );
}

export async function runSerializableWithRetry<TTransaction, TResult>(
  runTransaction: TransactionRunner<TTransaction>,
  operation: (transaction: TTransaction) => Promise<TResult>,
  maxAttempts = MAX_TRANSACTION_ATTEMPTS,
): Promise<TResult> {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await runTransaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isTransactionWriteConflict(error) || attempt === maxAttempts) throw error;
    }
  }

  throw new Error("Transaction retry limit reached");
}
