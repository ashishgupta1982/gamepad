/**
 * Teams Sign-Out Endpoint
 *
 * Clears the Teams session cookie to log out the user
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear the teams-session cookie by setting it with Max-Age=0
    res.setHeader(
      'Set-Cookie',
      'teams-session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
    );

    return res.status(200).json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Teams sign-out error:', error);
    return res.status(500).json({ error: 'Sign-out failed' });
  }
}
