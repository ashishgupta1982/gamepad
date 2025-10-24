import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createTeamsSession } from '@/utils/teamsSession';

/**
 * Teams SSO Authentication Endpoint
 *
 * This endpoint handles Microsoft Teams Single Sign-On (SSO) authentication.
 * It exchanges a Teams SSO token for user information and creates a session.
 *
 * Flow:
 * 1. Receive Teams SSO token from client
 * 2. Exchange token for app-specific access (On-Behalf-Of flow)
 * 3. Exchange token for Microsoft Graph access
 * 4. Fetch user information from Microsoft Graph
 * 5. Create/update user in database
 * 6. Create JWT session cookie
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Step 1: Exchange Teams token for app-specific token (On-Behalf-Of flow)
    const appTokenResponse = await fetch(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          client_id: process.env.AZURE_AD_CLIENT_ID,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET,
          assertion: token,
          requested_token_use: 'on_behalf_of',
          scope: `${process.env.APP_ID_URI}/.default`,
        }),
      }
    );

    if (!appTokenResponse.ok) {
      const errorData = await appTokenResponse.text();
      console.error('App token exchange failed:', errorData);
      return res.status(401).json({ error: 'Failed to exchange token for app access' });
    }

    const appTokenData = await appTokenResponse.json();
    const appAccessToken = appTokenData.access_token;

    // Step 2: Exchange Teams token for Microsoft Graph token
    const graphTokenResponse = await fetch(
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          client_id: process.env.AZURE_AD_CLIENT_ID,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET,
          assertion: token,
          requested_token_use: 'on_behalf_of',
          scope: 'https://graph.microsoft.com/User.Read',
        }),
      }
    );

    if (!graphTokenResponse.ok) {
      const errorData = await graphTokenResponse.text();
      console.error('Graph token exchange failed:', errorData);
      return res.status(401).json({ error: 'Failed to exchange token for Graph access' });
    }

    const graphTokenData = await graphTokenResponse.json();
    const graphAccessToken = graphTokenData.access_token;

    // Step 3: Fetch user information from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${graphAccessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error('Failed to fetch user info:', errorData);
      return res.status(401).json({ error: 'Failed to fetch user information' });
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.mail || userInfo.userPrincipalName;
    const name = userInfo.displayName || userInfo.givenName || email;

    if (!email) {
      return res.status(400).json({ error: 'Unable to retrieve user email' });
    }

    // Step 4: Connect to database and create/update user
    await dbConnect();

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        name: name,
        role: 'user',
        lastLoginAt: new Date(),
      });
    } else {
      // Update existing user's last login
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Step 5: Create JWT session token
    const sessionPayload = {
      email: user.email,
      name: user.name,
      id: user._id.toString(),
      role: user.role,
    };

    const sessionToken = createTeamsSession(sessionPayload);

    // Step 6: Set session cookie with SameSite=None for Teams iframe
    res.setHeader(
      'Set-Cookie',
      `teams-session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}`
    );

    // Return user information
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Teams SSO error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
