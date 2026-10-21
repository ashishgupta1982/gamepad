import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { MAX_CUSTOM, normaliseCustomList } from '@/lib/quiz/catalogue';

// A signed-in player's custom quiz categories. A guest's live on the device
// (components/quiz/useCustomCategories.js), so this is for accounts only.
//
// GET  → { categories: [{id, name, description, emoji}] }
// PUT  { categories } → the whole list, replaced, cleaned and capped.
//
// The list used to be strings like "Name: description", written by PATCH
// /api/user. Old strings are read as objects here and saved back as objects.

const makeId = () => `c_${crypto.randomBytes(6).toString('hex')}`;

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: 'Sign in to keep categories on your account.' });

  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return res.status(404).json({ error: 'Account not found' });

  if (req.method === 'GET') {
    const categories = normaliseCustomList(user.customQuizCategories, makeId);
    return res.status(200).json({ categories });
  }

  if (req.method === 'PUT') {
    const list = req.body?.categories;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'categories must be a list' });
    if (list.length > MAX_CUSTOM) return res.status(400).json({ error: `Up to ${MAX_CUSTOM} categories.` });
    const categories = normaliseCustomList(list, makeId);
    user.customQuizCategories = categories;
    user.markModified('customQuizCategories');
    await user.save();
    return res.status(200).json({ categories });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
