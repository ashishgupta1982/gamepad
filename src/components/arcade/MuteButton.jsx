import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, onMutedChange, play, setMuted } from './sfx';

// The sound switch for the header. Sound is on until someone turns it off, and
// the choice is remembered on the device.
export default function MuteButton() {
  // Read after mount: the server has no localStorage, and reading it during
  // render would give the server and the browser different markup.
  const [muted, setState] = useState(false);
  useEffect(() => {
    setState(isMuted());
    return onMutedChange(setState);
  }, []);

  const toggle = () => {
    setMuted(!muted);
    if (muted) play('tap');
  };

  const Icon = muted ? VolumeX : Volume2;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
      className="press flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
