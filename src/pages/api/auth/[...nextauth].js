import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb-adapter';
import User from '../../../models/User';
import dbConnect from '../../../lib/mongodb';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID || "common", // Use "common" for multi-tenant
      authorization: {
        params: {
          scope: "openid email profile User.Read",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  pages: {
    signIn: '/signin',  // Redirect to custom sign-in page
    error: '/signin',   // Redirect to sign-in page on error
  },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      // If the URL is a relative path, redirect to home page
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // If the URL is the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url;
      // Otherwise redirect to home page
      return baseUrl;
    },
    session: async ({ session, user }) => {
      session.userId = user.id;
      // Add age to session.user
      await dbConnect();
      const dbUser = await User.findOne({ email: user.email });

      // Initialize missing fields for new users
      let needsUpdate = false;
      
      if (dbUser && needsUpdate) await dbUser.save();

      session.user.role = dbUser?.role ?? 'student';
      return session;
    },
  },
  // Add debug option for more detailed NextAuth logs
  // debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);