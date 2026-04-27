# TOEFL iBT AI Writing Assistant

A local-first web application for TOEFL iBT Writing practice. Two writing task types are supported — Writing an Email and Academic Discussion — and structured AI feedback is provided, scored against the ETS 0-5 rubric. All LLM calls are made directly from the browser; no API keys are ever sent to the server.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [LLM Configuration](#llm-configuration)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [How It Works](#how-it-works)
- [Architecture Notes](#architecture-notes)

---

## Features

**Writing Practice**

- Two TOEFL iBT writing modes are available: Writing an Email (7 minutes, 100-130 words) and Academic Discussion (10 minutes, 100+ words)
- A countdown timer is displayed with a visual warning at 2 minutes remaining; the essay is submitted automatically when the timer expires
- Word count is updated in real time in the writing editor
- An exclusive exam mode is activated during practice: the screen enters fullscreen, navigation is blocked, and a 10-second grace period is given if fullscreen is exited

**AI Feedback**

- An overall score is assigned on the ETS 0-5 rubric
- Rubric sub-scores are provided for development, organization, language use, and vocabulary
- Grammar corrections are shown with the original and corrected text displayed side by side
- Vocabulary suggestions are listed with reasoning
- A coherence analysis is included
- Strengths and areas for improvement are identified
- A polished version of the submitted essay is generated, preserving the original ideas while correcting errors

**Prompt Management**

- 18 built-in prompts are included across both modes and three difficulty levels (Beginner, Intermediate, Advanced)
- New questions can be generated on demand using the configured LLM
- The prompt selection page shows which prompts have already been answered and the most recent score for each

**Adaptive Difficulty**

- Prompt difficulty is automatically adjusted based on the last 5 submission scores
- A manual difficulty override is available in Settings
- A minimum of 3 submissions is required before the difficulty level is changed

**User Accounts and Progress**

- Registration and login are handled via email and password
- Sessions are managed with JWT tokens with a 7-day expiry
- A dashboard is provided with a score trend chart, skill radar chart, and submission statistics
- A full submission history is maintained with links to past feedback
- Guest mode is available: practice sessions can be completed without an account, but feedback is not saved

**LLM Provider Choice**

- Ollama (local): a locally running Ollama instance is used at a configurable endpoint
- Gemini API: a user-supplied Google Gemini API key is used, stored only in the browser
- A test connection button is available for Ollama that pings the model list endpoint without running inference
- The model is warmed up when the practice page loads to reduce cold-start latency

---

## Tech Stack

| Layer                      | Technology                             |
| -------------------------- | -------------------------------------- |
| Framework                  | Next.js 16 (App Router) with React 19  |
| Language                   | TypeScript (strict mode)               |
| Styling                    | Tailwind CSS v4                        |
| Database                   | SQLite via Prisma ORM                  |
| Authentication             | Custom JWT using `jose` and `bcryptjs` |
| Validation                 | Zod                                    |
| Charts                     | Recharts                               |
| Unit and Integration Tests | Vitest                                 |
| End-to-End Tests           | Playwright                             |

---

## Prerequisites

The following must be installed before the project can be run:

- **Node.js** 20 or later
- **npm** 10 or later
- **Ollama** (optional) — required only if a local LLM is to be used for evaluation. Available at [ollama.com](https://ollama.com).

Docker, PostgreSQL, and cloud services are not required. The application runs entirely on a local machine using a SQLite database file.

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/your-username/toefl-helper.git
cd toefl-helper
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

The example file should be copied and the required values filled in:

```bash
cp .env.example .env.local
```

At minimum, the following must be set in `.env.local`:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-here-minimum-32-characters-long"
```

A full description of each variable is provided in the [Environment Variables](#environment-variables) section.

**4. Set up the database**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

The SQLite database file is created at `prisma/dev.db` and seeded with 18 writing prompts across all modes and difficulty levels.

**5. Start the development server**

```bash
npm run dev
```

The application is accessible at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

All variables are defined in `.env.local`. The `.env.example` file should be used as a starting point.

| Variable              | Required | Description                                                                                                                               |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Yes      | Path to the SQLite database file. `file:./dev.db` is used for local development.                                                          |
| `JWT_SECRET`          | Yes      | Secret key used to sign and verify JWTs. A minimum of 32 characters is required. A value can be generated with `openssl rand -base64 32`. |
| `DATABASE_PROVIDER`   | No       | Database provider. Defaults to `sqlite`. Set to `postgresql` when switching to Postgres.                                                  |
| `NEXT_PUBLIC_APP_URL` | No       | Public URL of the application, used for metadata. Defaults to `http://localhost:3000`.                                                    |

The Gemini API key and Ollama endpoint are stored in the browser's `localStorage` only. They are never sent to the server and do not belong in environment variables.

---

## Database Setup

**SQLite** is used for local development. The database is a single file at `prisma/dev.db`, which is excluded from version control.

**First-time setup**

```bash
# Apply the schema and create the database file
npx prisma migrate dev --name init

# Seed with 18 built-in writing prompts
npx prisma db seed
```

**Viewing and editing data**

```bash
npx prisma studio
```

A browser-based GUI is opened at [http://localhost:5555](http://localhost:5555) where any table can be inspected and modified.

**Resetting the database**

```bash
npx prisma migrate reset
```

All data is dropped and migrations and the seed script are re-run. This is used when a clean state is needed during development.

**After schema changes**

```bash
npx prisma migrate dev --name describe-your-change
npx prisma generate
```

---

## LLM Configuration

Two LLM providers are supported. Configuration is done on the Settings page and stored in the browser's `localStorage`. Nothing is sent to the server.

### Ollama (Local)

Ollama runs a language model on the local machine. This option is recommended for privacy and offline use.

**Setup:**

1. Ollama is installed from [ollama.com](https://ollama.com).
2. A model is pulled. The default model configured in the application is `gemma4`, but a lighter alternative is recommended for faster responses:

```bash
ollama pull qwen2.5:7b
```

3. If the model is changed, `OLLAMA_MODEL` in `src/lib/constants.ts` must be updated to match.

4. Ollama must be running before a practice session is started:

```bash
ollama serve
```

5. By default, Ollama does not allow cross-origin requests from the browser. It must be configured to allow requests from `http://localhost:3000`:

```bash
# On macOS/Linux
OLLAMA_ORIGINS=http://localhost:3000 ollama serve

# On Windows (PowerShell)
$env:OLLAMA_ORIGINS="http://localhost:3000"; ollama serve
```

6. In the application, the Settings page is opened, Ollama is selected, and "Test Connection" is clicked to verify the setup.

### Gemini API

The Google Gemini API can be used with a personal API key if a cloud-based model is preferred.

1. An API key is obtained from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In the application, the Settings page is opened, Gemini is selected, and the API key is pasted in.
3. The key is stored only in the browser and is never sent to the application server.

---

## Project Structure

```
toefl-helper/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── seed.ts                # Seed data (18 built-in prompts)
│
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   │   ├── (auth)/            # Login and register pages
│   │   ├── api/               # API route handlers
│   │   ├── dashboard/         # Progress dashboard
│   │   ├── feedback/          # Feedback display after submission
│   │   ├── history/           # Submission history list and detail
│   │   ├── practice/          # Writing editor (timed exam session)
│   │   ├── prompts/           # Prompt selection pages
│   │   └── settings/          # LLM config and difficulty settings
│   │
│   ├── components/
│   │   ├── dashboard/         # Chart and stats components
│   │   ├── editor/            # PracticeShell and WritingEditor
│   │   ├── feedback/          # All feedback display components
│   │   ├── layout/            # Header and Footer
│   │   ├── prompts/           # GeneratePromptButton
│   │   ├── settings/          # LlmConfigPanel
│   │   └── ui/                # Primitive components (Button, Card, Modal, etc.)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx    # JWT auth state and helpers
│   │   └── ExamContext.tsx    # Exam mode state (navigation is hidden during tests)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts         # Re-exports from AuthContext
│   │   ├── useExamMode.ts     # Fullscreen, navigation blocking, countdown
│   │   ├── useLlmEvaluation.ts # Client-side LLM call with retry logic
│   │   ├── useTimer.ts        # Countdown timer
│   │   └── useWordCount.ts    # Live word count
│   │
│   ├── lib/
│   │   ├── adaptive.ts        # Difficulty level calculation
│   │   ├── auth.ts            # JWT and bcrypt utilities
│   │   ├── constants.ts       # Timer durations, thresholds, storage keys
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── validators.ts      # Zod schemas for all API inputs
│   │   └── llm/
│   │       ├── client.ts      # LLM client factory
│   │       ├── gemini.ts      # Gemini API client
│   │       ├── ollama.ts      # Ollama client with warm-up support
│   │       ├── promptGenerator.ts  # Prompt generation via LLM
│   │       ├── prompts.ts     # ETS rater system prompt templates
│   │       └── schema.ts      # Zod schema for LLM response validation
│   │
│   ├── proxy.ts               # Next.js auth guard (JWT verification, route protection)
│   └── types/                 # TypeScript type definitions
│
├── tests/
│   ├── e2e/                   # Playwright end-to-end tests
│   ├── integration/           # Vitest integration tests (API routes)
│   └── unit/                  # Vitest unit tests (hooks, lib)
│
├── docs/
│   ├── API.md                 # API endpoint documentation
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   └── DEPLOYMENT.md          # Deployment notes
│
├── .env.example               # Environment variable template
├── next.config.ts
├── playwright.config.ts
├── prisma.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## Available Scripts

| Script                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | Development server is started at http://localhost:3000   |
| `npm run build`           | Application is built for production                      |
| `npm run start`           | Production server is started (a build is required first) |
| `npm run lint`            | ESLint is run across the codebase                        |
| `npm run lint:fix`        | ESLint is run and issues are automatically fixed         |
| `npm run format`          | All source files are formatted with Prettier             |
| `npm run format:check`    | Formatting is checked without writing changes            |
| `npm run typecheck`       | TypeScript type checking is run without emitting files   |
| `npm run test`            | All unit and integration tests are run once              |
| `npm run test:watch`      | Tests are run in watch mode                              |
| `npm run test:e2e`        | Playwright end-to-end tests are run                      |
| `npm run test:e2e:ui`     | Playwright tests are run with the interactive UI         |
| `npm run test:e2e:headed` | Playwright tests are run in a visible browser window     |

---

## Testing

Three layers of tests are included in the project.

**Unit and integration tests (Vitest)**

```bash
npm run test
```

Utility functions, hooks, adaptive difficulty logic, LLM response parsing, and API route behavior are covered by these tests.

**End-to-end tests (Playwright)**

```bash
npm run test:e2e
```

The development server must be running, or it will be started automatically by Playwright using the `webServer` configuration in `playwright.config.ts`. The full practice flow, authentication, history, and settings persistence are covered.

Note: E2E tests that involve LLM evaluation mock the Ollama endpoint so no real model is required.

---

## How It Works

**Practice session flow**

1. A writing mode is selected from the home page (Email or Discussion).
2. The prompt selection page is shown, listing all available prompts by difficulty. Prompts that have already been answered display the most recent score and a "View Result" button.
3. When "Start" is clicked on a prompt, a pre-test confirmation screen is shown explaining the rules.
4. When "Start Test" is clicked, fullscreen mode is entered and the countdown timer begins.
5. The essay is written. Navigation is blocked during the session.
6. On submission — either manual or automatic when the timer expires — the essay is sent to the configured LLM provider directly from the browser.
7. The LLM response is validated against a Zod schema. If validation fails, the request is retried up to two more times.
8. The validated feedback is saved to the database via `POST /api/submissions`.
9. The feedback page is shown with the score, corrections, and polished version.

**Authentication flow**

1. A user registers or logs in. A signed JWT is returned by the server.
2. The JWT is stored in `localStorage` and also set as a cookie for server-side page rendering.
3. The `proxy.ts` file (Next.js 16's equivalent of `middleware.ts`) intercepts requests to protected routes, verifies the JWT, and injects the user ID as an `x-user-id` header for API route handlers.
4. Page routes (`/dashboard`, `/history`, `/settings`) redirect to `/login` if the cookie is missing or invalid.

**LLM key security**

The Gemini API key and Ollama endpoint are stored only in `localStorage`. They are read by client-side hooks and used to make requests directly from the browser to the LLM provider. They are never included in any request to the application's own API routes.

---

## Architecture Notes

**Why SQLite?**

This project is designed for local, single-user use. SQLite requires no server process, no configuration, and no network access. The entire database is a single file. If the application needs to be shared across multiple users or deployed to a server, a switch to PostgreSQL can be made by changing `DATABASE_PROVIDER` to `postgresql` and updating `DATABASE_URL` in `.env.local`.

**Why client-side LLM calls?**

Routing LLM calls through the server would require API keys to be stored on the server, which creates a security and privacy risk. By making all LLM calls from the browser, the API key never leaves the user's machine. The trade-off is that CORS must be configured on the Ollama instance to allow browser requests.
