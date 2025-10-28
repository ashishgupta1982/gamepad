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
      let user = await User.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Initialize customQuizCategories if it doesn't exist (for existing users)
      if (user.customQuizCategories === undefined) {
        user.customQuizCategories = [];
        await user.save();
      }

      return res.status(200).json({
        name: user.name,
        email: user.email,
        role: user.role,
        customQuizCategories: user.customQuizCategories || []
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Initialize customQuizCategories if it doesn't exist (for existing users)
      if (user.customQuizCategories === undefined) {
        user.customQuizCategories = [];
      }

      // Update allowed fields
      if (req.body.customQuizCategories !== undefined) {
        user.customQuizCategories = req.body.customQuizCategories;
      }
      
      await user.save();

      return res.status(200).json({
        name: user.name,
        email: user.email,
        role: user.role,
        customQuizCategories: user.customQuizCategories
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}