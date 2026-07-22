# Contributing

How to land a change in AutoWRX. This applies to everyone; team-specific release
and deployment steps are in [Internal Onboarding](./internal/README.md).

AutoWRX is an **Eclipse Foundation** project, MIT-licensed. That has one hard
requirement up front — the ECA.

---

## 1. Sign the Eclipse Contributor Agreement (ECA) — required

Every contributor must sign the **[Eclipse Contributor Agreement](https://www.eclipse.org/legal/eca/)**
before their PR can be merged. Pull requests run an automated **`eclipsefdn/eca`**
check; if you haven't signed (with the same email you commit with), the check
fails and the PR is blocked — regardless of code quality.

- Sign at <https://accounts.eclipse.org/> with the email you use for git commits.
- Your commits must use that email (`git config user.email`).
- Sign off is expected on commits: `git commit -s` (adds `Signed-off-by:`).

---

## 2. Fork, branch, change

```bash
# fork on GitHub, then:
git clone https://github.com/<you>/autowrx.git
cd autowrx
git checkout -b <short-descriptive-branch>
```

- Keep changes focused — one logical change per PR. Avoid grab-bag PRs bundling
  unrelated features (they're hard to review and risky to merge).
- Match the **style of the file you're editing** and the
  [Design Principles](../principles/principle.md).
- New source files carry the **MIT SPDX header** used across the repo.

---

## 3. Verify locally (CI won't do it for you)

> **Important:** the PR pipeline currently only runs the **ECA** check — there is
> **no automated build/test/lint gate on PRs**. So you must verify locally
> before opening the PR.

```bash
# frontend
cd frontend && npx tsc --noEmit && yarn build

# backend
cd backend && yarn test
```

Run the app ([Local Development](./local-development.md)) and exercise the actual
flow you changed — don't rely on types/tests alone.

---

## 4. Commit & open the PR

- Write clear commit messages (imperative summary; explain the *why* in the body).
- `git commit -s` (sign-off) with your ECA email.
- Push your branch and open a PR against `main`.
- In the PR description: what changed, why, and how you verified it.

A maintainer reviews for correctness, scope, and adherence to the principles.
Address feedback by pushing follow-up commits.

---

## 5. What reviewers look for

- **Focused scope** — no unrelated changes riding along.
- **Correctness** — verified by actually running the change, not just types.
- **No silent regressions** — especially around auth/permissions, and the
  frontend↔backend contract.
- **Principles** — thin controllers / logic in services (backend); atomic-design
  layering and Query-vs-Zustand separation (frontend).
- **Security** — never expose secrets to the frontend or plugins; respect the
  permission model.

---

## Releases & deployment

Cutting releases and deploying are **maintainer/team** actions — see
[Internal Onboarding → Releases](./internal/README.md#releases). In short:
releases are **date-tagged** (`vYYYY.MM.DD`); pushing the tag builds and
publishes the Docker image and a GitHub Release.

Welcome aboard — start with a small, focused PR to get through the flow once.
