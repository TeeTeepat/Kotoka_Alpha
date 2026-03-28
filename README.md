# Kotoka

A language learning app that turns any photo into a vocabulary lesson. Point your camera at the world — Kotoka's AI extracts relevant words, provides translations, phonetics, and example sentences, then drills them via spaced repetition.

**Core loop:** Snap a photo → AI generates vocabulary → Review flashcards → Track streaks & collect gacha rewards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Auth | NextAuth.js v5 (Google OAuth + email/password) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| AI | Google Gemini 2.5 Flash |
| Email validation | ZeroBounce API |
| Runtime | Node.js 20 |

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Google OAuth app](https://console.cloud.google.com/) (Client ID + Secret)
- A [NextAuth secret](https://generate-secret.vercel.app/32) (random 32-char string)

---

## Quick Start (Local)

### 1. Clone the repo

```bash
git clone <repo-url>
cd WorkSpace_Alpha
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts a PostgreSQL 16 container on `localhost:5432` with:
- Database: `kotoka_phase1`
- User: `kotoka`
- Password: `kotoka_dev`

### 4. Configure environment variables

Create `.env.local` in the project root — see [Environment Variables](#environment-variables) below.

### 5. Push the database schema

```bash
npx prisma db push
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Windows note:** If `prisma db push` fails with a DLL lock error, kill all Node processes first:
> `cmd /c "taskkill /F /IM node.exe"` then re-run.

---

## Environment Variables

Create `.env.local` in the project root with the following:

```env
# Database
DATABASE_URL=postgresql://kotoka:kotoka_dev@localhost:5432/kotoka_phase1

# NextAuth
AUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# ZeroBounce (optional — email validation falls back to regex if unset)
ZEROBOUNCE_API_KEY=your-zerobounce-api-key-here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | Yes | Base URL of the app (`http://localhost:3000` locally) |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret from Google Cloud Console |
| `GEMINI_API_KEY` | Yes | API key for Gemini 2.5 Flash (vocabulary generation) |
| `ZEROBOUNCE_API_KEY` | No | Email validation — signup degrades gracefully without it |

> **Never commit `.env.local` or any file containing real secrets.** The `.gitignore` excludes all `.env*` files.

---

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run ESLint

npx prisma db push       # Sync schema to database (no migration history)
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma studio        # Open visual database browser (http://localhost:5555)
npx prisma migrate dev   # Create a named migration (staging/prod workflows)
```

---

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, user, decks, snap, gacha, shop, words)
│   ├── onboarding/    # Language selection flow (shown after signup)
│   ├── snap/          # Photo capture + AI vocabulary extraction
│   ├── review/        # Spaced repetition flashcard review
│   ├── gacha/         # Gacha item pull UI
│   ├── shop/          # In-game coin shop
│   ├── profile/       # User profile, stats, logout
│   ├── login/         # Authentication page
│   └── signup/        # Registration page
├── components/        # Shared UI components (BottomNav, Providers, etc.)
├── lib/               # Utilities: Prisma client, Gemini config, helpers
├── types/             # TypeScript type definitions
└── middleware.ts       # NextAuth route protection

prisma/
└── schema.prisma      # Database schema (User, Deck, Word, GachaItem, Account, Session)
```

---

## How It Works

```
User uploads photo
      │
      ▼
POST /api/snap
      │
      ▼
Gemini 2.5 Flash
(analyzes image, returns 5-8 vocabulary words
 with translation, phonetic, example sentence)
      │
      ▼
Saved to Deck + Words (Prisma → PostgreSQL)
      │
      ▼
Spaced repetition review
(SM-2 algorithm: masteryCount, easeFactor, interval, nextReviewAt)
```

**Identity model:** Every user (authenticated or anonymous) has a `kotoka-uid` HttpOnly cookie linked to a `User` row. On login, the cookie is synced to the authenticated user's record via `POST /api/auth/init`.

---

## Deployment (Docker Compose)

The repo includes a `docker-compose.yml` for full-stack local deployment:

```bash
# Build and start everything (app + postgres)
docker compose up --build

# Stop
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v
```

The app container runs `npx prisma migrate deploy && npm start` on startup.

**Production checklist before deploying:**
- [ ] Set all required env vars in your hosting platform's secrets manager
- [ ] Change `DATABASE_URL` to point to your production database
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Use `npx prisma migrate deploy` (not `db push`) in production
- [ ] Ensure `AUTH_SECRET` is a strong random value

---

## Contributing

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes.** Follow the existing code style (TypeScript strict, Tailwind utility classes, Prisma for all DB access).

3. **Ensure `npm run build` passes** and the dev server runs without errors.

4. **Lint before pushing:**
   ```bash
   npm run lint
   ```

5. **Open a Pull Request** against `main` with a clear description of what changed and why.

**Branch naming:** `feat/`, `fix/`, `chore/`, `docs/` prefixes.

**Commit style:** Conventional Commits — `feat: add gacha animation`, `fix: cookie sync on logout`.

---

## Database Schema

| Model | Purpose |
|-------|---------|
| `User` | Core user record — hearts, streak, coins, language preferences |
| `Deck` | A vocabulary set created from one photo snap |
| `Word` | Individual vocabulary item with spaced repetition metadata |
| `GachaItem` | Collectible items earned through the gacha system |
| `Account` | OAuth provider links (NextAuth) |
| `Session` | Active JWT sessions (NextAuth) |

Schema lives in `prisma/schema.prisma`. After any schema change:

```bash
npx prisma db push      # dev (no migration file)
npx prisma generate     # regenerate the client
# restart dev server
```

---

## License

MIT
"# Kotoka_Alpha" 
