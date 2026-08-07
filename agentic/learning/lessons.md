# Lessons

Append-only log of concrete lessons from real sessions. One line per entry:

```
- YYYY-MM-DD — <session or area> — <what you learned> (source)
```

Keep it specific and sourced; if a lesson generalizes, propose it into `memory/` or `best-practices.md` via PR.

## Example

- 2026-08-07 — framework-setup — `authLimiter` is defined in `backend/src/middlewares/rateLimiter.js` but not applied to any route, so login is currently unthrottled. (source: grep over `backend/src`; recorded in `memory/gotchas.md`)

## Log

<!-- append new entries below this line -->