// The brand, in one place, imported by BOTH sides:
//   - src/lib/auth.js (server) for the transactional emails
//   - the sign-in dialog and auth pages (client) for the accent colour
//
// It deliberately has NO imports. auth.js pulls in mongoose, the MongoDB adapter
// and bcrypt, so a client component importing the brand from there would drag
// all of that into the browser bundle.
export const BRAND = {
  name: 'GamePad',

  // The rust from the design tokens (--brand: 21 90% 48%). Duplicated as hex on
  // purpose: email clients cannot read a Tailwind class or a CSS variable, so
  // this is the documented exception to the "colour lives in one place" rule.
  colour: '#EA580C',

  url: 'https://gamepad.ashishgupta.co.uk',

  // One app-specific sentence appended to the verification email. Copy that is
  // about THIS app lives here, never in the shared package's templates.
  verifyNote: 'Then pick a game — your scores and stats will start saving automatically.',
};
