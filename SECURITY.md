# Security Policy

Eclipse AutoWRX is an [Eclipse Foundation](https://www.eclipse.org) project and
follows the
[Eclipse Foundation Vulnerability Reporting Policy](https://www.eclipse.org/projects/handbook/#vulnerability).
This file explains how to report a vulnerability and what to expect after you
report it.

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues, pull
requests, discussions or mailing lists.** A public report exposes users before
a fix is available.

Report vulnerabilities privately through one of these channels:

- **Email:** the Eclipse Foundation Security Team at
  [security@eclipse-foundation.org](mailto:security@eclipse-foundation.org).
- **Confidential issue:** the
  [Eclipse Foundation vulnerability reporting tracker](https://gitlab.eclipse.org/security/vulnerability-reports/-/issues/new?issuable_template=new_vulnerability).

The Security Team does not open attachments. Paste logs, proof-of-concept code
and other material inline as plain text.

Please include as much of the following as you can:

- The affected component (for example `backend/`, `frontend/`,
  `instance-setup/` or a GitHub workflow) and the version, release tag or
  commit.
- The type of issue (for example authentication bypass, injection, cross-site
  scripting or exposure of secrets).
- Step-by-step instructions to reproduce it, including any required
  configuration.
- The impact: what an attacker could do and which preconditions they need.
- Any suggested fix or mitigation.

## Scope

In scope:

- Code in this repository: the backend API (`backend/`), the web frontend
  (`frontend/`), the deployment files in `instance-setup/` and the GitHub
  workflows in `.github/workflows/`.
- The container images built and published from this repository.
- Vulnerable third-party dependencies **when they are exploitable through
  AutoWRX**. If a dependency is affected but AutoWRX is not exploitable, report
  it to that dependency's maintainers instead.

Out of scope:

- Deployments that are operated by third parties. Report those to the
  organization that operates the deployment.
- Findings that need a misconfiguration documented as unsafe, such as running
  with development settings or default credentials in production.
- Reports from automated scanners that do not show a concrete impact on
  AutoWRX.
- Social engineering, physical attacks and denial of service through traffic
  volume.

## Supported versions

AutoWRX ships rolling, date-tagged releases (for example `v2026.10.26`) from
the `main` branch. Security fixes are made on `main` and delivered in the next
release. Older releases do not receive backported fixes, so stay on the latest
release.

## Disclosure process

1. The Eclipse Foundation Security Team acknowledges the report and works with
   the AutoWRX committers to confirm it and assess its severity.
2. The committers develop and test a fix in private.
3. Fixed vulnerabilities are disclosed publicly once the fix is released,
   usually with a CVE assigned through the Eclipse Foundation, which is a CVE
   Numbering Authority. Reporters are credited unless they ask not to be.

The Eclipse Foundation policy expects a vulnerability to be resolved and
disclosed **no more than three months** after it is reported. The Project
Leadership Chain and the Security Team can extend this window when a fix needs
more time, or shorten it when early disclosure is required to protect users.
Please keep the details confidential until the vulnerability is disclosed.

## Security-related documentation

- [Auth & Security architecture](docs/architecture/auth-security.md)
- [Contributing guide](docs/getting-started/contributing.md), including the
  security scans that run on every pull request
- [Eclipse Foundation security page](https://www.eclipse.org/security/)
