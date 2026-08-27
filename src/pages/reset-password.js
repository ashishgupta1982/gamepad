import Head from 'next/head';
import { ResetPasswordPage } from '@aspiro/auth/ui';
import { BRAND } from '../lib/brand';

// Served for the /reset-password?token=… link the package emails.
//
// The package generates that URL, so the app has to serve the page or the
// emailed link 404s — silently, with nothing in the code to say why. GamePad
// has no middleware and no signed-out redirect, so nothing here can eat the
// link; that is worth keeping true if an auth gate is ever added.
export default function ResetPassword() {
  return (
    <>
      <Head>
        <title>Reset your password — GamePad</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ResetPasswordPage accent={BRAND.colour} redirectTo="/" />
    </>
  );
}
