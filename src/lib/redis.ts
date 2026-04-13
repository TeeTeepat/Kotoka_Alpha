// src/lib/redis.ts
// Serverless-safe Redis adapter.
// - Uses @upstash/redis (HTTP/REST) when UPSTASH_REDIS_REST_URL is set (production/Vercel)
// - Falls back to ioredis via dynamic import when REDIS_URL is set (local Docker)
// - Returns a no-op adapter when neither env var is present

interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

const noopAdapter: RedisAdapter = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
};

function createUpstashAdapter(): RedisAdapter {
  // Dynamic require to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis");
  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return {
    get: async (key) => {
      const val = await client.get(key) as string | null;
      return val ?? null;
    },
    set: async (key, value, ttlSeconds) => {
      if (ttlSeconds) {
        await client.set(key, value, { ex: ttlSeconds });
      } else {
        await client.set(key, value);
      }
    },
    del: async (key) => { await client.del(key); },
  };
}

async function createIoredisAdapter(): Promise<RedisAdapter> {
  const { default: Redis } = await import("ioredis");
  const client = new Redis(process.env.REDIS_URL!);
  client.on("error", (err: Error) => { console.warn("[redis]", err.message); });
  return {
    get: async (key) => client.get(key),
    set: async (key, value, ttlSeconds) => {
      if (ttlSeconds) {
        await client.set(key, value, "EX", ttlSeconds);
      } else {
        await client.set(key, value);
      }
    },
    del: async (key) => { await client.del(key); },
  };
}

// Promise-singleton: concurrent cold-start callers await the same init
let _adapterPromise: Promise<RedisAdapter> | null = null;

export function getRedis(): Promise<RedisAdapter> {
  if (!_adapterPromise) {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      _adapterPromise = Promise.resolve(createUpstashAdapter());
    } else if (process.env.REDIS_URL) {
      _adapterPromise = createIoredisAdapter();
    } else {
      _adapterPromise = Promise.resolve(noopAdapter);
    }
  }
  return _adapterPromise;
}
