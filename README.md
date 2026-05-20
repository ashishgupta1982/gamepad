# Gamepad

A family game launcher with four playable games: Scrabble Scorer, Quiz (Kahoot-style multi-device or same-device), Darts Scorer (X01, Cricket, Around the Clock, Killer), and Travel Bingo (road-trip photo bingo across multiple cars).

## Why

Built so the family can play games together on phones and tablets without paying for or installing separate apps. Scores persist for signed-in users; guests can play without an account.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (Pages Router) + React 19 |
| Styling | Tailwind CSS + ShadCN/UI |
| Auth | NextAuth.js (Google + Azure AD) |
| Database | MongoDB + Mongoose |
| Realtime | Server-Sent Events (SSE) for multi-device quiz |
| Media | Cloudinary (Travel Bingo photo uploads) |
| AI | Anthropic Claude SDK (cached) |
| Node | 22.x |

## Quick Start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Environment Variables

Copy to `.env.local`:

```
MONGODB_URI=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

GOOGLE_ID=
GOOGLE_SECRET=

AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

ANTHROPIC_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Games

| Game | Route | Notes |
|------|-------|-------|
| Scrabble Scorer | `/games/scrabble-scorer` | Up to 4 players, fun awards |
| Quiz | `/games/quiz` (`/games/quiz/join`) | Same-device or multi-device with 6-char room codes |
| Darts | `/games/darts` | X01, Cricket, Around the Clock, Killer |
| Travel Bingo | `/games/travel-bingo` | Multi-car road-trip bingo with photo proof |

## Project Structure

```
src/
├── pages/              # Routes + API
│   ├── games/          # Game UIs
│   └── api/            # REST + SSE endpoints
├── components/         # Per-game component folders + shared UI
├── models/             # Mongoose schemas
├── hooks/              # useQuizRoom, useQuizScoring, useQuizTimer
├── lib/                # mongodb, cloudinaryUpload, travelBingo helpers
├── utils/              # authHelper, rateLimiter
├── data/               # quizConstants, dartsConstants
└── styles/             # globals.css
```

## Deployment

Optimised for Vercel. Add env vars in the dashboard and deploy. Any Node 22 host works.
