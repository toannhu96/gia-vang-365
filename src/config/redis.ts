import dayjs from "dayjs";
import Redis from "ioredis";
import { parse, stringify, isInteger } from "lossless-json";

export const client = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    enableAutoPipelining: true,
    db: 1,
  }
);

export function customNumberParser(value: any) {
  return isInteger(value) ? BigInt(value) : parseFloat(value);
}

// const customNumberParser = undefined;
// TODO: Cache in memory of this function. Maybe usefull in serverless env. USING FIFO
type Parameters<T> = T extends (...args: infer T) => any ? T : never;
type ReturnType<T> = T extends (...args: any[]) => infer T ? T : never;

type WrapAsyncFunction<T, V = any> = (
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>> | Promise<V>;

const MemoryCache: Record<string, any> = {};

export const memorizeFunction = <T extends Function, V = any>(
  keyPrefix: string,
  fn: T,
  {
    defaultValue,
    ttl,
    keyFn,
    memory = false,
    disabled = false,
    normalJSON = true,
    throwOnError = false,
  }: {
    defaultValue?: V;
    ttl?: number;
    keyFn?: (input: Parameters<T>) => string | number;
    memory?: boolean;
    disabled?: boolean;
    normalJSON?: boolean;
    throwOnError?: boolean;
  }
): WrapAsyncFunction<T, V> => {
  return async (...input) => {
    try {
      const prune = input[input.length - 1]?.prune || false;
      if (prune) {
        // Remove the prune option from the key
        input.pop();
      }
      const key = `${keyPrefix}_${keyFn ? keyFn(input) : stringify(input)}`;

      if (disabled || process.env.NO_CACHE) {
        // Ignore cache in dev mode or we disabled it
        process.env.REDIS_LOG && console.log(`DISABLED CACHE: ${key}`);
        return await fn(...input);
      }

      if (memory) {
        const cachedValue = MemoryCache[key];
        if (cachedValue && cachedValue?.expiredTime > dayjs().unix) {
          return cachedValue.returnValue;
        }

        const returnValue = await fn(...input);
        MemoryCache[key] = {
          returnValue,
          expiredTime: dayjs().unix() + (ttl || 365 * 24 * 60 * 60),
        };

        return returnValue;
      }

      const cachedValue = prune
        ? undefined
        : await client.get(key).catch((error) => {
            console.error(error);

            return undefined;
          });

      if (cachedValue) {
        process.env.REDIS_LOG && console.log(`HIT: ${key}`);
        return normalJSON
          ? JSON.parse(cachedValue).value
          : parse(cachedValue, null, customNumberParser).value;
      }
      process.env.REDIS_LOG && console.log(`MISS: ${key}, TTL: ${ttl}`);
      const returnValue = await fn(...input);

      // Save to Redis
      const valueJSON = normalJSON
        ? JSON.stringify({ value: returnValue })
        : stringify({ value: returnValue });
      if (valueJSON !== undefined) {
        client.set(key, valueJSON).then(() => {
          if (ttl) {
            return client.expire(key, ttl);
          }

          return true;
        });
      }
      return returnValue;
    } catch (error) {
      console.log(error);
      if (throwOnError) {
        throw error;
      }
      return defaultValue;
    }
  };
};

export const purgeCache = async (keyPrefix: string, input?: any[]) => {
  try {
    if (!input) {
      await Promise.allSettled([
        client.unlink(keyPrefix),
        client
          .keys(keyPrefix)
          .then(async (keys) => {
            if (!keys.length) {
              return;
            }

            console.log("Going to unlink keys", keys);
            await client.unlink(keys);

            return keys;
          })
          .catch((error) => {
            console.error("Error deleting keys");
            console.error(error);
          }),
      ]);

      console.log(`Done delete ${keyPrefix}`);
      return;
    }

    const key = `${keyPrefix}_${JSON.stringify(input)}`;
    await client.unlink(key);
    console.log(`Done delete ${key}`);
  } catch (error) {
    console.error(error);
  }
};

export const getOrSet = async <T extends Function>(
  key: string,
  fn: T,
  ttl = 0,
  disabled = false
): Promise<ReturnType<T>> => {
  if (process.env.NO_CACHE || disabled) {
    // Ignore cache in dev mode or we disabled it
    console.log(`DISABLED CACHE: ${key}`);
    return await fn();
  }

  process.env.REDIS_LOG && console.time(`Get or set ${key}`);
  const cachedValue = await client.get(key);
  if (cachedValue !== null) {
    process.env.REDIS_LOG && console.log(`HIT: ${key}`);
    return JSON.parse(cachedValue).value;
  }

  // console.time(`DATA::${key}`);
  const returnValue = await fn();
  // console.timeEnd(`DATA::${key}`);
  const valueJSON = JSON.stringify({ value: returnValue });
  if (valueJSON !== undefined) {
    await client.set(key, valueJSON);
    if (ttl) {
      await client.expire(key, ttl);
    }
  }

  process.env.REDIS_LOG && console.timeEnd(`Get or set ${key}`);

  return returnValue;
};

export const setRedis = async (key: string, data: any, ttl = 0) => {
  try {
    const valueJSON = stringify({ value: data });
    if (valueJSON !== undefined) {
      await client.set(key, valueJSON);
    }
    if (ttl) {
      await client.expire(key, ttl);
    }
  } catch (error) {
    console.error(`Error setting redis key: ${key}`, error);
  }
};

export const getRedis = async (key: string, defaultValue?: any) => {
  try {
    const cachedValue = await client.get(key);
    if (cachedValue !== null) {
      console.log(`HIT: ${key}`);
      return parse(cachedValue, null, customNumberParser).value;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    console.error(`${key} is MISS on redis`);
    return null;
  } catch (error) {
    console.error(`Error getting redis key: ${key}`, error);
    return defaultValue;
  }
};

export const getTTL = async (key: string): Promise<number> => {
  try {
    const ttl = await client.ttl(key);
    if (ttl === -1) {
      console.log(`Key: ${key} has no expiration`);
    } else if (ttl === -2) {
      console.log(`Key: ${key} does not exist`);
    } else {
      console.log(`TTL for key: ${key} is ${ttl} seconds`);
    }
    return ttl;
  } catch (error) {
    console.error(`Error fetching TTL for key: ${key}`, error);
    return 0;
  }
};
