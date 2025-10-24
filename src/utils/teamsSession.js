import jwt from 'jsonwebtoken';

/**
 * Verifies and decodes a Teams session JWT token
 *
 * @param {string} token - The JWT token from the teams-session cookie
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyTeamsSession(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Invalid Teams session token:', error.message);
    return null;
  }
}

/**
 * Creates a JWT token for Teams session
 *
 * @param {Object} payload - User data to encode in the token
 * @param {string} payload.email - User's email
 * @param {string} payload.name - User's name
 * @param {string} payload.id - User's database ID
 * @param {string} payload.role - User's role
 * @returns {string} Signed JWT token
 */
export function createTeamsSession(payload) {
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
  return token;
}

/**
 * Gets the Teams session from a Next.js request
 *
 * @param {Object} req - Next.js request object
 * @returns {Object|null} User session data or null if not authenticated
 */
export function getTeamsSession(req) {
  const cookies = req.cookies || {};
  const token = cookies['teams-session'];

  if (!token) {
    return null;
  }

  return verifyTeamsSession(token);
}
