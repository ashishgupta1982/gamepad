// Make an account an admin, or take it away. A dry run unless --apply is given:
// it finds the account and says what it would change.
//
//   npm run make-admin -- someone@example.com                    show the account's role
//   npm run make-admin -- someone@example.com --apply            make it an admin
//   npm run make-admin -- someone@example.com --remove --apply   back to an ordinary user
//
// An admin can forget a player's seen questions on the quiz home (Ash,
// 2026-10-23). The account must exist, so sign in once first. The role reaches
// the session on its next refresh; signing out and in again is quickest. The
// database is MONGODB_URI from .env.local, the live one.
import mongoose from 'mongoose';

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
const apply = args.includes('--apply');
const role = args.includes('--remove') ? 'user' : 'admin';

if (!email) {
  console.log('Which account? npm run make-admin -- someone@example.com [--remove] [--apply]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection('users');
try {
  const user = await users.findOne({ email });
  if (!user) {
    console.log(`No account for ${email}. Sign in to GamePad with it once, then run this again.`);
    process.exitCode = 1;
  } else if ((user.role ?? 'user') === role) {
    console.log(`${email} is already ${role === 'admin' ? 'an admin' : 'an ordinary user'}.`);
  } else if (!apply) {
    console.log(`${email} is ${user.role ?? 'user'}. With --apply it becomes ${role}.`);
  } else {
    await users.updateOne({ _id: user._id }, { $set: { role } });
    console.log(`${email} is now ${role}.`);
  }
} finally {
  await mongoose.disconnect();
}
