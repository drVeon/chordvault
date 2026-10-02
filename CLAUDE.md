# ChordVault

Self-hosted chord sheet manager: songs in ChordPro, setlists, transposition, PDF export, and Gemini-powered OCR of photographed sheets. Express + SQLite (better-sqlite3) backend at the repo root; React + Vite + TypeScript frontend in `frontend/`.

## Build and run

Two separate npm packages, so install both: `npm ci` at the root and in `frontend/`. Node 24+.

- **Dev:** copy `.env.example` to `.env` (the server exits without `JWT_SECRET`), then `npm run dev` at the root. It runs the API on :3100 and Vite on :5173, which proxies `/api` to it.
- **Production build:** `npm run build` in `frontend/` writes into `../public/` (gitignored output), which `node server.js` serves on :3100.
- **Docker:** `docker compose up --build` builds the image from the `Dockerfile` and also reads `.env`. CI publishes the image on pushes to the `veon` branch and on `v*` tags.

The SQLite database lives in `data/` (override with `DB_PATH`).

## Tests

Backend: `npm test` at the root (`node --test`, in-memory DB via `DB_PATH=':memory:'`). Frontend: `npm test` in `frontend/` (Vitest), plus `npx tsc --noEmit`. The husky pre-commit hook runs all of these plus lint-staged. Each package has its own lint-staged config, because lint-staged runs tasks without a shell.

## Git

`origin` is the drVeon fork; `upstream` is rusahu/chordvault. Work happens on `veon`.
