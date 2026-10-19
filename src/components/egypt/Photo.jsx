/* eslint-disable @next/next/no-img-element -- remote Wikimedia photos, cached by public/egypt-sw.js; next/image would proxy them through Vercel and defeat that cache */
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { PHOTOS } from '@/data/egypt/photos';
import { cn } from '@/lib/cn';

// One photo from data/egypt/photos.js. `fill` lets the parent set the shape
// (a hero, a thumbnail); otherwise the photo keeps its own proportions, with
// width and height set so the page does not jump as it loads.
export default function Photo({ id, className, imgClassName, fill = false, eager = false, showCredit = false }) {
  const photo = PHOTOS[id];
  const [failed, setFailed] = useState(false);
  if (!photo) return null;

  return (
    <div className={cn('relative overflow-hidden bg-lapis/10', className)}>
      {failed ? (
        <div className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-1 p-4 text-center text-xs text-muted-foreground">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          No signal for this photo
        </div>
      ) : (
        <img
          src={photo.src}
          alt={photo.caption}
          width={photo.w}
          height={photo.h}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(fill ? 'h-full w-full object-cover' : 'h-auto w-full', imgClassName)}
        />
      )}
      {showCredit && !failed && (
        <span className="pointer-events-none absolute bottom-1 right-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/85">
          {photo.credit}
        </span>
      )}
    </div>
  );
}
