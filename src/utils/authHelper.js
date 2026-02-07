import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * Authentication helper using NextAuth sessions
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<Object|null>} User object with { email, name, id, role } or null
 */
export async function getAuthenticatedUser(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (session?.user) {
    return {
      email: session.user.email,
      name: session.user.name,
      id: session.user.id,
      role: session.user.role,
    };
  }

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
