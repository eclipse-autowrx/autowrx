# ETAS #403 — Recorded browser test

The 51-second recording and its assertion results are kept locally. All seven
scenarios passed. Test video files are intentionally not committed or pushed.

Recorded on 2026-10-26 using Playwright-driven UI actions against the actual
AutoWRX production frontend build and backend. The browser-control connector
was unavailable, so this is an automated browser walkthrough, not a human
manual test session.

The environment uses a fresh disposable MongoDB instance, throwaway accounts
and two test models. A mock Socket.IO runtime receives commands. No customer
instance or data is used. Existing invalid models are seeded directly into the
disposable database to represent pre-fix data; validation/API responses are
not mocked during the recording.

| Step | UI action | Expected result |
| --- | --- | --- |
| 1 | Replace a valid model with JSON containing empty `Vehicle.Cabin` | HTTP 400 names the path; the previous model remains unchanged |
| 2 | Press Play on a legacy invalid model in the built-in panel | Validation error; no generation/run command |
| 3 | Rebuild that model through Send Request | HTTP 400; no generation command |
| 4 | Press Play on the invalid model in the ETAS runtime-panel plugin | Path-specific notice; Play recovers; no generation/run command |
| 5 | Explicitly rebuild through the plugin | Validation error; no generation/run command |
| 6 | Replace the plugin model's VSS through the UI with a populated Cabin branch | Replacement succeeds |
| 7 | Press Play with the corrected model | Preflight succeeds; mock runtime receives generation and run requests |

Visible captions are test annotations, not product UI. Socket frames and API
responses are checked by the recording script. The recording demonstrates
validation, recovery and command dispatch; it does not demonstrate real
hardware compilation/execution. The unchanged-model assertion is checked via
the raw model API after the failed replacement.

Recording command: `node /tmp/etas403/record-walkthrough.cjs`. The temporary
harness and recording script live outside the repository. Repeatable regression
coverage is in `.agents/tests/vss-validation.spec.ts` and the companion
extensions change's `e2e/tests/vss-validation.spec.ts`.
