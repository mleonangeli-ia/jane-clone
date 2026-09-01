# JaneClone

Multi-tenant appointment management for health and wellness professionals, built with Next.js, Prisma and PostgreSQL.

## Getting Started

Install dependencies, configure the variables documented in `.env.example`, apply the database migrations and start the development server:

```bash
npm install
npm run db:migrate:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Run the verification suite with:

```bash
npm test
npm run lint
npm run build
```

## Production deployment

Production configuration fails fast when required values are missing or invalid. Store real values in the deployment provider's secret manager; never commit `.env` or `.env.local`.

Required production variables:

- Core: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `CAPTCHA_SECRET`
- Email and cron: `RESEND_API_KEY`, `FROM_EMAIL`, `CRON_SECRET`
- Web Push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Payments, when enabled: `PAYMENTS_ENABLED=true`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- Optional integrations: Google Calendar credentials and `AFIP_ENCRYPTION_KEY`

Before deploying a schema change:

1. Back up the production database.
2. Run `npm run db:migrate:deploy` in a secret-aware production environment.
3. Confirm that `prisma migrate status` reports the database as up to date.
4. Deploy the application and run production smoke tests.

The Vercel build only runs `npm run build`. Database schema changes are intentionally excluded from preview builds and must never use `prisma db push` in production.
