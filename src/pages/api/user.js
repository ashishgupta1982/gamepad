import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export default async function handler(req, res) {
  // Only allow authenticated users
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}