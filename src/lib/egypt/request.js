// POST JSON to an Egypt Explorer route, with an error a family can act on.
//
// Every failure says what kind it was, and carries the HTTP status, so a
// "that didn't work" on the phone can be traced: no signal, a photo the
// platform refused as too big (Vercel answers 413 in plain text, before our
// route runs), the platform timing out, or our own message from the route.
const TIMEOUT_MS = 70 * 1000;

export async function postJson(url, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(
      err?.name === 'AbortError'
        ? 'The guide took too long to answer. Check your signal and try again.'
        : 'Could not reach the guide. Check your signal and try again.',
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (res.ok && data) return data;

  if (data?.error) throw new Error(data.error);
  if (res.status === 413) throw new Error('That photo was too big to send. Try again, a little further back.');
  if (res.status === 504) throw new Error('The guide took too long to answer. Try again.');
  throw new Error(`Something went wrong (${res.status}). Try again.`);
}
