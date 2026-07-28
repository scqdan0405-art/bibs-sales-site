# Security Policy

## Supported Version

The current MVP branch is supported for security fixes before production release.

## Reporting

Do not open public issues containing secrets, personal information, customer data, or exploit details. Contact the repository owner privately.

## Secret Handling

- Never commit `.env` or production credentials.
- Use `.env.example` only for placeholder variable names.
- Rotate `SESSION_SECRET`, `ADMIN_PASSWORD`, SMTP/API keys, and storage credentials before production.
- Do not upload real customer inquiry data to GitHub.

## Production Notes

Before release, configure HTTPS, HSTS, SPF, DKIM, DMARC, backup storage, and a real mail adapter. Run the full CI commands and complete `docs/PRODUCTION_CHECKLIST.md`.
