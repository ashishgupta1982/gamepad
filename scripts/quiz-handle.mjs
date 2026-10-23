// Give an account its quiz name (handle), and with it every guest memory of
// that name, on any account (lib/quiz/memory.js#claimHandle). A dry run unless
// --apply is given: it says what the name would take over.
//
//   npm run quiz:handle -- anya@example.com Anya            what it would do
//   npm run quiz:handle -- anya@example.com Anya --apply    do it
//
// A player gets a handle on their own the first time they open the quiz
// signed in (their first name), and can change it there; this is for mapping
// a guest name the family already plays under onto someone's account. The
// database is MONGODB_URI from .env.local, the live one.
import mongoose from 'mongoose';
import { claimHandle } from '../src/lib/quiz/memory.js';
import { cleanHandle, nameKey } from '../src/lib/quiz/seen.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const [email, ...rest] = args.filter((a) => !a.startsWith('--'));
const handle = cleanHandle(rest.join(' '));
if (!email || !handle) {
  console.log('npm run quiz:handle -- <email> <name> [--apply]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
try {
  const who = email.trim().toLowerCase();
  const user = await db.collection('users').findOne({ email: who });
  const taken = await db.collection('users').findOne({ quizNameKey: nameKey(handle), email: { $ne: who } });
  if (!user) {
    console.log(`No account for ${who}. They need to sign in to GamePad once first.`);
    process.exitCode = 1;
  } else if (taken) {
    console.log(`${handle} is already ${taken.email}'s quiz name.`);
    process.exitCode = 1;
  } else if (!apply) {
    const guests = await db.collection('quizseens').find({ nameKey: nameKey(handle), linkTo: { $exists: false } }).toArray();
    console.log(`${who}: quiz name ${user.quizName ? `${user.quizName} → ` : ''}${handle}`);
    for (const g of guests) console.log(`  takes over the guest ${g.name} on ${g.email}: ${g.seen?.length || 0} questions seen`);
    if (!guests.length) console.log('  no guest of that name to take over');
    console.log('Run again with --apply to do it.');
  } else {
    const { adopted } = await claimHandle(db, who, handle);
    console.log(`${who} is now ${handle} in the quiz.`);
    for (const a of adopted) console.log(`  took over the guest on ${a.account}: ${a.seen} questions seen`);
  }
} finally {
  await mongoose.disconnect();
}
