/**
 * Upload a file directly to Cloudinary from the browser.
 * The server only generates a short-lived signature — the file never passes through Vercel.
 * Cloudinary handles HEIC/HEVC → JPG conversion and quality optimisation natively.
 *
 * Pass the active gameId + carId so the signature endpoint can verify the request
 * belongs to a real Travel Bingo game (the only photo-upload caller for now).
 */
export async function uploadToCloudinary(file, { gameId, carId } = {}) {
  const sigQs = new URLSearchParams();
  if (gameId) sigQs.set('gameId', gameId);
  if (carId) sigQs.set('carId', carId);
  const sigUrl = sigQs.toString()
    ? `/api/cloudinary-signature?${sigQs.toString()}`
    : '/api/cloudinary-signature';

  const sigRes = await fetch(sigUrl);
  if (!sigRes.ok) throw new Error('Failed to get upload signature');
  const { signature, timestamp, apiKey, cloudName, folder, publicId } = await sigRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('format', 'jpg');
  formData.append('quality', 'auto');

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Cloudinary upload failed');
  }

  const result = await uploadRes.json();

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
  };
}
