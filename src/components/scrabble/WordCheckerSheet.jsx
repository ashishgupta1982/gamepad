import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

// "Is that a word?" — the argument-settler, via /api/claude.
//
// Was a collapsible panel wedged above the scoreboard, open by accident as often
// as on purpose, pushing the board down when it expanded. It is an occasional
// action, so it belongs behind a deliberate tap rather than permanently
// occupying the top of the play screen.
//
// The response is rendered by splitting on ** pairs. That is not a Markdown
// parser and is not trying to be — the prompt asks for exactly this shape, and
// pulling in a renderer for three bold spans would cost more than the feature.
function renderResponse(text) {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line, lineIndex) => (
      <p key={lineIndex} className={lineIndex === 0 ? 'text-base font-semibold' : 'text-sm'}>
        {line.split(/(\*\*.*?\*\*)/g).map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i} className="text-muted-foreground">
              {part}
            </span>
          ),
        )}
      </p>
    ));
}

export default function WordCheckerSheet({ open, onOpenChange }) {
  const [word, setWord] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    const trimmed = word.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setResult(null);
    setError('');

    const prompt = `You are a Scrabble word validator. Check whether "${trimmed.toUpperCase()}" is valid in the official Scrabble dictionary.

Respond in exactly this format:

**${trimmed.toUpperCase()}** - [✅ Valid or ❌ Not Valid]

**Definition:** [if valid, a clear concise definition; if not, why it is not accepted]

**Notes:** [dictionary status, usage or etymology worth knowing]

Keep it short and useful for family game play.`;

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useCache: true }),
      });
      if (!res.ok) {
        // The rate limiter returns a usable message; a bare "failed" here would
        // read as a bug when it is actually just too many lookups in a minute.
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not check that word.');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const valid = typeof result === 'string' && result.includes('✅');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Check a word" description="Settle it before the next turn.">
        <div className="flex gap-2">
          <Input
            value={word}
            onChange={(e) => {
              setWord(e.target.value);
              setResult(null);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            placeholder="Enter a word"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="uppercase"
            disabled={busy}
          />
          <Button type="button" onClick={check} disabled={!word.trim() || busy} size="icon" aria-label="Check word">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {result && (
          <Alert variant={valid ? 'success' : 'destructive'} className="mt-4">
            <div className="space-y-1.5">{renderResponse(result)}</div>
          </Alert>
        )}
      </SheetContent>
    </Sheet>
  );
}
