# Immortify Digital mail outreach

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, and SMTP values in
`.env`; then run `npm run db:seed` and `npm run dev`. The dashboard
imports opted-in CSV/JSON contacts and creates campaigns with an unsubscribe
link. Campaigns are sent manually: each campaign is configured with how many
contacts may run at once, and remaining contacts stay queued until you run the
campaign again from the campaigns list.

## Database

Neon PostgreSQL is used for the application database. Set this environment
variable locally and in Vercel:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
```

Use the **pooled** connection string (the one containing `-pooler`) for the
serverless runtime so many concurrent requests share a single connection.
`POSTGRES_URL` and `NEON_DATABASE_URL` are also supported as fallbacks.

Vercel must have `DATABASE_URL` configured for the Production environment,
followed by a new deployment.

The Prisma runtime uses the Neon driver adapter (`@prisma/adapter-neon`) and
fails fast when the variable is missing or is not a `postgres://` URL.

Apply the schema to your Neon database and create the admin user:

```bash
npm run db:deploy   # or npm run db:migrate when developing
npm run db:seed
```

`npm run db:studio` opens Prisma Studio against the same Neon database.

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
