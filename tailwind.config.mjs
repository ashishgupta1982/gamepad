/** @type {import('tailwindcss').Config} */

// Every colour is an HSL *channel triplet* (`21 90% 48%`) defined in
// src/styles/globals.css, not a full `hsl(...)` string. That is what makes the
// `<alpha-value>` placeholder work, so `bg-brand/10` and `border-border/50`
// generate real colours instead of silently producing nothing.
//
// One definition drives both Tailwind classes and raw CSS. The previous config
// did neither cleanly: it mixed hardcoded hex with `hsl(var(--x))`, declared
// `background` twice in the same object literal (the first was dead), and
// defined a deep-blue palette that no component ever used while the real UI
// hardcoded orange/amber/teal inline.
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],

  // Only ./src exists. The old config also scanned ./pages, ./components and
  // ./app, none of which are real directories in this repo.
  //
  // The @aspiro/auth entry is REQUIRED and is not optional tidiness: Tailwind
  // only generates classes it can see, and by default it never looks inside
  // node_modules. Drop that line and none of the sign-in dialog's utility
  // classes are emitted, so it renders with no positioning, no background and
  // no size — invisible. Nothing errors, nothing warns, and the DOM node is
  // genuinely there. It has cost a debugging session in more than one app.
  content: [
    './src/**/*.{js,jsx}',
    './node_modules/@aspiro/auth/src/**/*.{js,jsx}',
  ],

  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),

        // Brand — GamePad's rust. Kept deliberately: `theme_color` in
        // manifest.json, the icons and the OG card are all built around
        // #EA580C by the brand pass (c4f1c91). Changing it would invalidate them.
        brand: {
          DEFAULT: token('brand'),
          deep: token('brand-deep'),
          foreground: token('brand-foreground'),
          soft: token('brand-soft'),
        },
        // Secondary accent — teal. The other half of the existing identity.
        accent: {
          DEFAULT: token('accent'),
          deep: token('accent-deep'),
          foreground: token('accent-foreground'),
          soft: token('accent-soft'),
        },

        // Surfaces. `card.foreground` is new: components/ui/card.jsx has always
        // asked for `text-card-foreground`, but the token was never defined, so
        // the class generated nothing.
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },

        // Semantic
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        success: {
          DEFAULT: token('success'),
          deep: token('success-deep'),
          foreground: token('success-foreground'),
        },
        warning: {
          DEFAULT: token('warning'),
          foreground: token('warning-foreground'),
        },

        // Per-game accents. Each game gets one identity colour, used by its card
        // on the launcher and its header in play, so a player can tell at a
        // glance which game the phone is currently showing.
        game: {
          scrabble: { DEFAULT: token('game-scrabble'), deep: token('game-scrabble-deep') },
          quiz: { DEFAULT: token('game-quiz'), deep: token('game-quiz-deep') },
          darts: { DEFAULT: token('game-darts'), deep: token('game-darts-deep') },
          bingo: { DEFAULT: token('game-bingo'), deep: token('game-bingo-deep') },
          egypt: { DEFAULT: token('game-egypt'), deep: token('game-egypt-deep') },
        },

        // Egypt Explorer's surfaces (components/egypt only).
        papyrus: {
          DEFAULT: token('papyrus'),
          foreground: token('papyrus-foreground'),
        },
        lapis: token('lapis'),
        gold: token('gold'),
      },

      fontFamily: {
        // Set on :root by next/font in _app.js.
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },

      // Minimum comfortable touch target. `min-h-touch` reads as intent where
      // `min-h-11` reads as a magic number.
      spacing: {
        touch: '44px',
      },

      transitionTimingFunction: {
        // Overshoot-and-settle. This is the tactile press feel: a control that
        // squashes under a thumb and springs back rather than snapping.
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      backdropBlur: {
        xs: '2px',
      },

      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0.5' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0.5' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },

  plugins: [],
};
