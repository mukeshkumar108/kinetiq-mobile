# AGENTS.md

## Purpose
This repository is the Expo / React Native client for Kinetiq, the habits + todos app.

## Current Product Scope
- Clerk auth
- Today dashboard
- Habit/task management
- Basic profile + progression

## Working Rules
- Preserve the backend contract shape from the `kinetiq` repo (`success/data/error`).
- Keep query keys session-scoped so user data does not bleed across sign-in changes.
- When mutating habits or tasks, invalidate the domain list plus Today and progression.
- Do not hide failed requests behind empty states.
- Prefer incremental, verification-heavy changes over broad UI rewrites.

## UX Direction
- Target audience is Gen Z.
- The app should feel playful, animated, and premium.
- Do not add decorative motion before the core flow is reliable.
- Preserve iOS-first polish and interaction quality.

## Documentation Discipline
- Update `README.md` for human-facing repo guidance when scope changes.
- Update `CHANGELOG.md` for meaningful engineering changes.
- Keep this file current when architecture rules or product priorities change.
