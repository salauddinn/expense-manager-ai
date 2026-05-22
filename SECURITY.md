# Security Policy

## Supported Versions

Only the latest release on the `main` branch receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability in FinTrack, please **do not** open a public GitHub issue.

Instead, report it privately via GitHub's [Security Advisories](https://github.com/salauddinn/expense-manager-ai/security/advisories/new) page.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce
- Affected versions or commits
- Any suggested fix (optional)

We will acknowledge your report within **72 hours** and aim to release a fix within **14 days** for critical issues.

## Scope

In scope:

- The FinTrack web application (this repository)
- The `llm-proxy` Supabase Edge Function

Out of scope:

- Vulnerabilities in third-party dependencies (please report to the upstream project)
- Issues that require physical access to the user's device
- Self-XSS or social engineering attacks
