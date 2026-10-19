// A phone photo, made small enough to send to the guide.
//
// A phone camera shoots 12 megapixels or more, several MB as a file and a third
// more again as base64, which is over Vercel's 4.5 MB request limit and costs
// image tokens for detail the model cannot use. 1280px on the long side is
// plenty to read a label or name a statue, and lands at a few hundred KB.
//
// Three ways to read the photo, tried in turn, because phones disagree about
// what they can decode: an <img> (applies EXIF rotation everywhere current),
// then createImageBitmap, then, for a JPEG, PNG or WebP small enough to send
// as it is, the file itself. A HEIC from a phone that cannot decode it is the
// one case that still fails, with a message saying to use the camera button.
const MAX_SEND_BYTES = 3 * 1024 * 1024;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('decode'));
    el.src = url;
  });
}

function draw(source, width, height, max, quality) {
  const scale = Math.min(1, max / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(source, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}

export async function photoToDataUrl(file, { max = 1280, quality = 0.82 } = {}) {
  if (!file) throw new Error('No photo.');
  const url = URL.createObjectURL(file);
  try {
    try {
      const img = await loadImage(url);
      return draw(img, img.naturalWidth, img.naturalHeight, max, quality);
    } catch {
      // fall through
    }
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        return draw(bitmap, bitmap.width, bitmap.height, max, quality);
      } catch {
        // fall through
      }
    }
    if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= MAX_SEND_BYTES) {
      return await readAsDataUrl(file);
    }
    throw new Error('This phone could not open that photo. Try taking a new one with the camera button.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
