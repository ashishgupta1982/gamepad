import Head from 'next/head';
import { VerifyEmailPage } from '@aspiro/auth/ui';
import { BRAND } from '../lib/brand';

// Served for the /verify-email?token=… link the package emails. See the note in
// reset-password.js — the same "app must serve what the package links to" rule
// applies, and failing it is silent.
export default function VerifyEmail() {
  return (
    <>
      <Head>
        <title>Verify your email — GamePad</title>
        <meta name="robots" content="noindex" />
      </Head>
      <VerifyEmailPage accent={BRAND.colour} redirectTo="/" />
    </>
  );
}
