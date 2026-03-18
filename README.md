# Kinetiq Mobile

React Native / Expo client for the Kinetiq habits + todos product.

## Current Scope

- Clerk auth for sign-in/sign-up
- Today dashboard for daily habits, tasks, and XP
- Manage screen for creating/archiving habits and creating/deleting focus tasks
- Profile screen with canonical user + progression summary
- Shared API client against the Kinetiq backend under `/api/v1/*`

## Product Direction

- iOS-first
- Gen Z audience
- Gamified habits + todos
- Strong motion / delight layer once core data flow is stable

Current priority is correctness and flow quality before adding heavier animation and premium UI surfaces.

## App Structure

- `app/`: Expo Router entrypoints and tab layout
- `src/screens/`: top-level screen components
- `src/modules/`: per-domain API + React Query hooks
- `src/api/`: Axios client, query client, query keys, invalidation helpers
- `src/shared/`: theme, API envelope types, reusable UI primitives

## Local Commands

```bash
pnpm start
pnpm ios
pnpm typecheck
pnpm test
```

## Engineering Notes

- All protected API calls rely on Clerk session tokens in the `Authorization` header.
- Query cache is scoped per signed-in user to avoid stale cross-session data.
- Habit/task mutations must invalidate their list query, Today, and progression.
- Error states should stay explicit; do not silently treat failed fetches as empty states.

## Known Next Steps

- Replace the diagnostic auth shell with the intended premium onboarding/auth experience.
- Add richer reward moments from progression / achievement responses.
- Introduce device registration and push flow once physical-device notification setup is ready.
- Expand test coverage around screen behavior and mutation UX once a dedicated RN test stack is added.
