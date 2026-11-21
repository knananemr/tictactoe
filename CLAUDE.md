# Project: knanamer's Workspace

## About
Personal projects workspace on macOS.

## Current Projects
- `tictactoe.html` — web-based Tic-Tac-Toe game (playable in browser)
- `tictactoe.py` — terminal-based Tic-Tac-Toe game
- `qr-menu/` — QR-code digital menu template (Hebrew + English, view-only); per-client content lives in `qr-menu/config.js`
- `shop-finder/` — "Nearby": local shop & clinic finder prototype (Hebrew + English, Vite build, no backend yet); source in `shop-finder/src/` (module map: `shop-finder/src/README.md`); demo shops in `shop-finder/src/demo-data.js`, categories in `shop-finder/src/categories.js`
  - Look: `shop-finder/THEME-BLUEPRINT.md` (Indigo theme) and `shop-finder/design/mockups/`
  - iPhone app plan: `shop-finder/APP-BLUEPRINT.md` — follow it step by step and tick its progress list
  - Tests: `cd shop-finder && npm install && npm test` (builds `dist/`, then runs the 232 checks in `tests/suite.js`; must stay green)
  - View it: `npm run dev`, or `npm run build && npm run preview`; opening `index.html` from disk shows a blank page

## GitHub
- Repo: https://github.com/knananemr/tictactoe
- Always commit with clean messages and push after changes

## Rules
- Never commit `.env` files or secrets
- Keep commit messages short and descriptive
- Push to GitHub after every meaningful change so there's always a saved version
