# CHANGELOG

Concise engineering changelog for Kinetiq Mobile.

## EAS Dev Build Prep (2026-03-19)
### Summary
- Prepared the Expo repo for iPhone development builds with EAS.

### Key Changes
- Added `expo-dev-client` so the app can run as a custom dev client on a physical iPhone.
- Added `eas.json` with a minimal internal-distribution development profile.
- Added iOS bundle/build identifiers and enabled broad ATS loading for local HTTP backend testing during development.
- Added a `start:dev-client` script for launching Metro in dev-client mode.
- Added pnpm build trust for Skia so native iOS binaries are available during pod install and EAS builds.
- Linked the project to EAS, configured updates metadata, and switched to a unique iOS bundle identifier.
- Simplified the auth and Today surfaces after device testing by removing hidden ambient animation and fixing the broken Google CTA treatment.

## Product UI Pass: Auth and Today (2026-03-19)
### Summary
- Shipped the first premium product-facing UI pass focused on auth and the Today experience.

### Key Changes
- Replaced the diagnostic auth screen with a dark, atmospheric shell built around Reacticx grainy gradient, glow, and richer CTA treatment.
- Reworked Today into a stronger momentum dashboard with a premium hero card, clearer hierarchy, and improved rituals/focus presentation.
- Typed habit/task completion payloads from the backend so reward feedback is driven by real progression and achievement data.
- Added Reacticx toast-driven reward feedback for XP, streak, and achievement moments after completions.
- Added Reacticx component support and patched generated component typings/runtime gaps needed for this repo.

### Verification
- `pnpm exec tsc --noEmit`
- `pnpm test`

## Stability and Repo Baseline (2026-03-19)
### Summary
- Stabilized the mobile data flow, documented the repo, and added lightweight regression tests.

### Key Changes
- Scoped React Query caches by signed-in user to prevent cross-session data flashes.
- Added shared invalidation helpers so habit/task mutations refresh Today and progression consistently.
- Prefetched canonical `me` state at app bootstrap and cleared cache on auth transitions/sign-out.
- Added explicit failure states for Today and Manage instead of falling back to misleading empty states.
- Tightened mutation UX by preventing repeated taps during in-flight updates and closing inline create inputs on success.
- Added human-facing `README.md` and repo guidance in `AGENTS.md`.
- Added TypeScript-compiled `node:test` coverage for query-key behavior, invalidation fan-out, and API envelope helpers.

### Verification
- `pnpm exec tsc --noEmit`
- `pnpm test`
