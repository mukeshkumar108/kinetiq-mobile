# CHANGELOG

Concise engineering changelog for Kinetiq Mobile.

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
