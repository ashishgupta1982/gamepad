/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests by IP address with sliding window
 */

// In-memory store for rate limiting data
const rateLimitStore = new Map();

// Rate limit configurations
export const RATE_LIMITS = {
  // Most restrictive - expensive AI operations
  CLAUDE_API: {
    windowMs: 60 * 1000,     // 1 minute window
    maxRequests: 30,         // 30 requests per minute
    message: 'Too many AI requests. Please wait a minute before trying again.'
  },
  
  // Moderate limits for standard API operations
  STANDARD_API: {
    windowMs: 60 * 1000,     // 1 minute window
    maxRequests: 60,         // 60 requests per minute
    message: 'Too many requests. Please slow down.'
  },
  
  // Moderate limits for admin operations (need to allow test runs)
  ADMIN_API: {
    windowMs: 60 * 1000,     // 1 minute window
    maxRequests: 30,         // 30 requests per minute (allows test suites)
    message: 'Too many admin requests. Please wait before trying again.'
  },
  
  // Generous limits for read-only operations
  READ_API: {
    windowMs: 60 * 1000,     // 1 minute window
    maxRequests: 120,        // 120 requests per minute
    message: 'Too many requests. Please slow down.'
  }
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Clean up old entries from rate limit store
 * @param {number} windowMs - Time window in milliseconds
 */
function cleanupOldEntries(windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;
  
  for (const [key, data] of rateLimitStore.entries()) {
    // Remove timestamps older than the window
    data.requests = data.requests.filter(timestamp => timestamp > cutoff);
    
    // Remove entries with no recent requests
    if (data.requests.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param {string} identifier - Unique identifier (usually IP address)
 * @param {Object} config - Rate limit configuration
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(identifier, config) {
  const now = Date.now();
  const { windowMs, maxRequests } = config;
  
  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupOldEntries(windowMs * 2); // Clean entries older than 2x window
  }
  
  // Get or create entry for this identifier
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, { requests: [] });
  }
  
  const entry = rateLimitStore.get(identifier);
  
  // Remove requests outside the current window
  const windowStart = now - windowMs;
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  const currentRequests = entry.requests.length;
  const allowed = currentRequests < maxRequests;
  
  if (allowed) {
    // Add this request timestamp
    entry.requests.push(now);
  }
  
  return {
    allowed,
    remaining: Math.max(0, maxRequests - currentRequests - (allowed ? 1 : 0)),
    resetTime: Math.min(...entry.requests) + windowMs,
    current: currentRequests + (allowed ? 1 : 0),
    limit: maxRequests
  };
}

/**
 * Express middleware factory for rate limiting
 * @param {string} limitType - Type of rate limit to apply
 * @param {Object} options - Override options
 * @returns {Function} - Express middleware function
 */
export function createRateLimitMiddleware(limitType = 'STANDARD_API', options = {}) {
  const config = { ...RATE_LIMITS[limitType], ...options };
  
  if (!config) {
    throw new Error(`Unknown rate limit type: ${limitType}`);
  }
  
  return (req, res, next) => {
    const clientIP = getClientIP(req);
    const identifier = `${limitType}:${clientIP}`;
    
    const result = checkRateLimit(identifier, config);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000),
      'X-RateLimit-Current': result.current
    });
    
    if (!result.allowed) {
      return res.status(429).json({
        error: config.message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        limit: config.maxRequests,
        current: result.current,
        resetTime: new Date(result.resetTime).toISOString()
      });
    }
    
    next();
  };
}

/**
 * Simple rate limit check function (without Express middleware)
 * @param {string} identifier - Unique identifier
 * @param {string} limitType - Type of rate limit to apply
 * @returns {Object} - Rate limit result
 */
export function checkRate(identifier, limitType = 'STANDARD_API') {
  const config = RATE_LIMITS[limitType];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${limitType}`);
  }
  
  return checkRateLimit(`${limitType}:${identifier}`, config);
}

/**
 * Reset rate limit for a specific identifier (useful for testing)
 * @param {string} identifier - Unique identifier to reset
 * @param {string} limitType - Type of rate limit to reset
 */
export function resetRateLimit(identifier, limitType = 'STANDARD_API') {
  const key = `${limitType}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit stats (useful for monitoring)
 * @returns {Object} - Current rate limit statistics
 */
export function getRateLimitStats() {
  const stats = {
    totalIdentifiers: rateLimitStore.size,
    byType: {},
    memoryUsage: JSON.stringify([...rateLimitStore.entries()]).length
  };
  
  for (const [key] of rateLimitStore.entries()) {
    const [type] = key.split(':');
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }
  
  return stats;
}