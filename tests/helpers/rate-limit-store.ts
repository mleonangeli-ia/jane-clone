import type { RateLimitStore } from "@/lib/rate-limit";

type Bucket = { count: number; resetAt: Date };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  async consume(key: string, limit: number, windowMs: number): Promise<Bucket> {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.resetAt.getTime() <= now) {
      const bucket = { count: 1, resetAt: new Date(now + windowMs) };
      this.buckets.set(key, bucket);
      return { ...bucket };
    }

    current.count = Math.min(current.count + 1, limit + 1);
    return { ...current };
  }

  async peek(key: string): Promise<Bucket | null> {
    const bucket = this.buckets.get(key);
    return bucket ? { ...bucket } : null;
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}
