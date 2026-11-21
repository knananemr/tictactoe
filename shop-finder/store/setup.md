# Owner setup (Step 0)

Status of everything the owner provides. Secrets are never written here.
Last checked: 2026-11-21.

| Needed before | Item | Status |
| --- | --- | --- |
| Step 1 (repo move) | New private GitHub repo `nearby-app`, attached to the Claude session | Missing. Step 1 is being done inside `tictactoe/shop-finder/` meanwhile; `git subtree split` moves it with its full history once the repo exists. |
| Step 3 | Supabase: organisation "Nearby" (Pro) with project `nearby-prod`; organisation "Nearby dev" (Free) with project `nearby-dev`; project refs and URLs noted here; keys entered through the secure prompt | Missing |
| Step 3 | Domain, with its DNS managed at Cloudflare | Missing |
| Step 3 | Email-sending service account (Resend or Brevo) | Missing |
| Step 3 | Support email address | Missing |
| Step 7 | Apple Developer Program enrolment; team ID | Missing |
| Step 7 | App name (max 30 characters) and bundle ID; App ID registered; app record created in App Store Connect with primary language Hebrew, SKU `nearby-ios-1` | Missing |
| Step 7 | Mac: macOS version, `xcodebuild -version` (must be Xcode 26 or newer), an iOS simulator installed, Node 22+, Claude Code | Not checked yet |
| Step 8 | App Store Connect API key: `.p8` saved in `~/.appstoreconnect/private_keys/` on the Mac; Key ID and Issuer ID noted | Missing |

## Environment checked by the builder

- Cloud session: Node v22.23.5, npm 10.9.9, npm registry reachable (enough for Steps 1, 2 and 6).
