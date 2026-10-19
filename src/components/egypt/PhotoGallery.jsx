import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Expand } from 'lucide-react';
import Photo from './Photo';
import { PHOTOS } from '@/data/egypt/photos';

// A swipeable strip of a stop's photos, and a full-screen viewer behind it.
//
// The pictures are most of what makes a stop worth looking at, so every stop
// carries several and they get room: the strip shows most of one photo and the edge of
// the next, which is what tells a thumb it can swipe. Tapping opens the viewer at
// that photo, black and edge to edge, with the caption and the photographer.
export default function PhotoGallery({ ids, label = 'Photos' }) {
  const [open, setOpen] = useState(null);
  if (!ids?.length) return null;

  return (
    <section aria-label={label}>
      <ul className="scroll-contain -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {ids.map((id, i) => (
          <li key={id} className="w-[78%] shrink-0 snap-center sm:w-[46%]">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="press group block w-full overflow-hidden rounded-xl text-left shadow-sm ring-1 ring-black/5"
              aria-label={`Open photo: ${PHOTOS[id]?.caption}`}
            >
              <span className="relative block">
                <Photo id={id} fill className="aspect-[4/3]" />
                <Expand className="absolute right-2 top-2 h-7 w-7 rounded-full bg-black/40 p-1.5 text-white opacity-80" aria-hidden="true" />
              </span>
              <span className="block bg-card px-3 py-2 text-xs leading-snug text-muted-foreground">
                {PHOTOS[id]?.caption}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <PhotoViewer ids={ids} start={open} onClose={() => setOpen(null)} />
    </section>
  );
}

export function PhotoViewer({ ids, start, onClose }) {
  const track = useRef(null);
  const [index, setIndex] = useState(start || 0);

  // Jump to the tapped photo when the viewer opens.
  useEffect(() => {
    if (start == null) return;
    setIndex(start);
    requestAnimationFrame(() => {
      const el = track.current;
      if (el) el.scrollTo({ left: el.clientWidth * start, behavior: 'instant' });
    });
  }, [start]);

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const photo = PHOTOS[ids[index]];

  return (
    <DialogPrimitive.Root open={start != null} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col text-white outline-none">
          <DialogPrimitive.Title className="sr-only">{photo?.caption || 'Photo'}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Swipe for more photos.</DialogPrimitive.Description>
          <div className="flex items-center justify-between px-3 pt-safe">
            <span className="tnum text-sm text-white/70">
              {index + 1} / {ids.length}
            </span>
            <DialogPrimitive.Close
              className="press flex min-h-touch min-w-touch items-center justify-center rounded-full text-white/90 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div
            ref={track}
            onScroll={onScroll}
            className="scroll-contain flex flex-1 snap-x snap-mandatory overflow-x-auto"
          >
            {ids.map((id) => (
              <div key={id} className="flex w-full shrink-0 snap-center items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PHOTOS[id]?.src} alt={PHOTOS[id]?.caption} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
          <div className="px-4 pb-safe pt-3">
            <p className="text-sm leading-relaxed text-white/95">{photo?.caption}</p>
            <a href={photo?.page} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-white/60 underline-offset-2 hover:underline">
              Photo: {photo?.credit}, Wikimedia Commons
            </a>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
