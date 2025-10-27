import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '../../lib/mongodb';
import CachedResponse from '../../models/CachedResponse';
import { checkRate } from '../../utils/rateLimiter';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create cache key from prompt
function createCacheKey(prompt) {
  // Simple hash function for cache key
  return Buffer.from(prompt).toString('base64').substring(0, 50);
}

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

export default async function handler(req, res) {
  // Apply rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRate(clientIP, 'CLAUDE_API');
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many AI requests. Please wait a minute before trying again.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      limit: 10,
      current: rateLimitResult.current
    });
  }


  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, useCache = true } = req.body;
    
    // Simple length validation to prevent abuse - increased limit for definition prompts
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }
    
    if (prompt.length > 10000) {
      return res.status(400).json({ error: `Prompt too long (${prompt.length}/10000 characters)` });
    }

    // Create cache key for this prompt
    const cacheKey = createCacheKey(prompt);

    // Check cache for any responses
    if (useCache) {
      try {
        // Connect to MongoDB
        await dbConnect();

        try {
          // Check if we have this response in our cache
          const cachedResponse = await CachedResponse.findOne({ cacheKey: cacheKey });

          if (cachedResponse && cachedResponse.response) {
            console.log(`🔵 CACHE HIT: Response found in MongoDB cache`);

            // Add cache status header
            res.setHeader('X-Cache-Status', 'HIT');

            return res.status(200).json(cachedResponse.response);
          }
        } catch (findError) {
          console.error('Error finding response in cache:', findError);
          // Continue to call Claude API
        }
      } catch (cacheError) {
        // Log cache error but continue to call Claude API
        console.error('Error connecting to database:', cacheError);
      }
    }

    // Call Claude API normally
    // Increase max_tokens for quiz games that need to generate multiple questions
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // claude-3-sonnet-20240229 & claude-3-haiku-20240307
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7
    });

    // Extract the response content
    const response = message.content[0].text;

    // Set cache miss header
    res.setHeader('X-Cache-Status', 'MISS');

    // Cache the response if caching is enabled
    if (useCache) {
      try {
        await dbConnect();

        try {
          await CachedResponse.create({
            cacheKey: cacheKey,
            response: response,
            createdAt: new Date()
          });
          console.log(`🟢 CACHE STORE: Response saved to MongoDB cache`);
        } catch (createError) {
          // If unique constraint error, try update instead
          if (createError.code === 11000) {
            await CachedResponse.updateOne(
              { cacheKey: cacheKey },
              {
                response: response,
                createdAt: new Date()
              }
            );
            console.log(`🟢 CACHE UPDATE: Response updated in MongoDB cache`);
          } else {
            throw createError;
          }
        }
      } catch (cacheError) {
        console.error('Error caching response:', cacheError);
        // Continue even if caching fails
      }
    }

    // Return the response as-is (string format)
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return res.status(500).json({ 
      error: 'Unable to process your request. Please try again later.'
    });
  }
}