import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getTeamsSession } from './teamsSession';

/**
 * Unified authentication helper that supports both NextAuth and Teams sessions
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<Object|null>} User object with { email, name, id, role, sessionType } or null
 */
export async function getAuthenticatedUser(req, res) {
  // First, try to get NextAuth session (for web users)
  const nextAuthSession = await getServerSession(req, res, authOptions);

  if (nextAuthSession?.user) {
    return {
      email: nextAuthSession.user.email,
      name: nextAuthSession.user.name,
      id: nextAuthSession.user.id,
      role: nextAuthSession.user.role,
      sessionType: 'nextauth'
    };
  }

  // If no NextAuth session, try Teams session
  const teamsSession = getTeamsSession(req);

  if (teamsSession) {
    return {
      email: teamsSession.email,
      name: teamsSession.name,
      id: teamsSession.id,
      role: teamsSession.role,
      sessionType: 'teams'
    };
  }

  // No valid session found
  return null;
}

/**
 * Middleware to protect API routes - sends 401 if not authenticated
 *
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with authentication check
 */
export function withAuth(handler) {
  return async (req, res) => {
    const user = await getAuthenticatedUser(req, res);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach user to request for handler to use
    req.user = user;

    return handler(req, res);
  };
}
