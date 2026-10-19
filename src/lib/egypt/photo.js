// A phone photo, made small enough to send to the guide.
//
// A phone camera shoots 12 megapixels or more, several MB as a file and a third
// more again as base64, which is over Vercel's 4.5 MB request limit and costs
// image tokens for detail the model cannot use. 1280px on the long side is
// plenty to read a label or name a statue, and lands at a few hundred KB.
//
// Drawn through an <img>, which applies the photo's EXIF rotation in every
// current browser, so a portrait photo does not arrive on its side.
export async function photoToDataUrl(file, { max = 1280, quality = 0.82 } = {}) {
  if (!file) throw new Error('No photo.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That photo could not be opened. Try taking it again.'));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
