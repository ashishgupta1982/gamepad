import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

// Providers, adapter, Apple's cross-site cookies, events and callbacks all come
// from @aspiro/auth. Re-exported because API routes across the app import
// authOptions from here.
export { authOptions };

export default NextAuth(authOptions);
