const redis = require("../config/redis");

// Default cache duration — 1 hour in seconds
const DEFAULT_TTL = 3600;

/**
 * Get cached data by key
 * Returns parsed JSON or null if not found
 */
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("Cache get error:", error.message);
    return null; // Cache miss is not fatal — fall through to DB
  }
};

/**
 * Set data in cache with optional TTL
 */
const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error("Cache set error:", error.message);
    // Cache write failure is not fatal — data still returned from DB
  }
};

/**
 * Delete a specific cache key
 */
const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Cache delete error:", error.message);
  }
};

/**
 * Delete all cache keys matching a pattern
 * Used to invalidate all analytics for a business at once
 */
const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `🗑️  Invalidated ${keys.length} cache keys matching: ${pattern}`,
      );
    }
  } catch (error) {
    console.error("Cache pattern delete error:", error.message);
  }
};

/**
 * Build consistent cache keys
 */
const buildKey = {
  monthly: (businessId, month, year) =>
    `analytics:monthly:${businessId}:${month}:${year}`,
  trends: (businessId, months) => `analytics:trends:${businessId}:${months}`,
  breakdown: (businessId, month, year) =>
    `analytics:breakdown:${businessId}:${month}:${year}`,
  benchmark: (businessId, month, year) =>
    `analytics:benchmark:${businessId}:${month}:${year}`,
  score: (businessId, month, year) =>
    `analytics:score:${businessId}:${month}:${year}`,
  businessLogs: (businessId) => `analytics:*:${businessId}:*`,
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  buildKey,
};
