# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Email or DM the maintainers with:

1. Description of the vulnerability
2. Steps to reproduce
3. Impact assessment
4. Suggested fix (if any)

We aim to acknowledge within 48 hours and provide a fix timeline within 7 days for confirmed issues.

## Scope

MNESTIS is **local-first**. It reads files on disk and writes to `.MNESTIS/` in the target repository. It does not:

- Send repository data to external servers by default
- Require API keys for core functionality
- Execute arbitrary user code from the dashboard (terminal commands are allowlisted in workspace mode)

Report issues in:

- Path traversal in static file serving (`MNESTIS serve`, Vite dev middleware)
- Command injection in CLI or workspace terminal
- MCP tool handlers that escape repository boundaries

## Safe defaults

- Run `MNESTIS serve` bound to `localhost` only unless you explicitly configure otherwise
- Do not commit `.MNESTIS/` secrets if you store credentials in analyzed repos (MNESTIS does not redact file contents)
