# Project: knanamer's Workspace

## About
Personal projects workspace on macOS.

## Current Projects
- `tictactoe.html` — web-based Tic-Tac-Toe game (playable in browser)
- `tictactoe.py` — terminal-based Tic-Tac-Toe game
- `laser/` — Laser, a private dashboard for a solo laser hair removal practice (open `laser/index.html`; plain HTML, CSS and JavaScript, no build step, no npm, no server)
  - The plan is `laser/docs/BLUEPRINT.md`; build one step at a time, in its order
  - Built: contacts, client profiles, treatments and payments, schedule, the 4-week rebook list, leads, dashboard, monthly progress, prepared reminder messages, backup by file
  - Not built: automatic safety copies and phone install (blueprint step 1b), the booking link for clients (step 9)
  - The build is simpler than the blueprint in places; where they differ, the code is right
  - Tests: `NODE_PATH="$(npm root -g)" playwright test -c laser/tests/playwright.config.js --trace off`
  - How we build: small agent teams that read only what they need. The strongest model only for the hardest thinking (design, data-safety review), a middle model for building and fixing, a light model for tests

## GitHub
- Repo: https://github.com/knananemr/tictactoe
- Always commit with clean messages and push after changes

## Rules
- Never commit `.env` files or secrets
- Keep commit messages short and descriptive
- Push to GitHub after every meaningful change so there's always a saved version
