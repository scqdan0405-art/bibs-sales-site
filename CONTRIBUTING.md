# Contributing

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use Node.js 24 or later.

## Rules

- Follow `AGENTS.md` and the official specification document.
- Keep changes small and feature scoped.
- Do not add features outside the MVP scope without updating `docs/PENDING_CONFIRMATIONS.md`.
- Do not commit `.env`, uploads, logs, real customer data, or mail outbox files.
- Add or update tests for validation, contact submission, authentication, and file upload changes.
