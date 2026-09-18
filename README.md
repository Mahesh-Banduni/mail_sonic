# Immortify Digital mail outreach

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, SMTP values, and
`CRON_SECRET` in `.env`; then run `npm run db:seed` and `npm run dev`. The dashboard
imports opted-in CSV/JSON contacts, queues campaigns, and the cron route sends one
message every six seconds with an unsubscribe link.

## Database

Turso is required for the application database. Set these environment variables
locally and in Vercel:

```env
DATABASE_TURSO_DATABASE_URL="libsql://your-database.turso.io"
DATABASE_TURSO_AUTH_TOKEN="your-turso-auth-token"
```

Vercel must have these variables configured for the Production environment,
followed by a new deployment. `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are
also supported. Do not set either database URL to a local `file:` path.

The Prisma runtime uses the libSQL adapter and fails fast when either variable is
missing. Deploy the schema to your Turso database using your Turso migration workflow.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
