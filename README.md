# Pathaan Collection

The existing application code is organized into three folders without splitting or rewriting its page and API logic:

- `frontend/` contains the customer-facing HTML, shared `config.js` and `toast.js`, and images.
- `admin/` contains the existing admin screen at `index.html`.
- `backend/` contains the Express server, routes, models, middleware, services, data, uploads, and backend package files.

The existing admin screen is a single page, so it remains `admin/index.html`; separate admin pages were not created. A `wishlist.html` page was not present in the existing frontend and was not invented as part of this move.

## Local development

Install backend dependencies and start the app from the repository root:

```sh
npm --prefix backend ci
npm run dev
```

The server listens on port 5000 by default. `npm start` starts the production Node.js server.

## Deploy to Vercel

1. Import the repository into Vercel and set **Root Directory** to the repository root (`./`).
2. Keep the configured install command (`npm --prefix backend ci`) so Vercel installs the backend dependencies.
3. Add production environment variables in Vercel project settings. Do not commit `.env`.
4. Deploy and verify `/`, `/admin`, and `/api/health`.

Required production environment variables:

- `MONGO_URI`: production MongoDB connection string. The local JSON fallback is not durable production storage.
- `JWT_SECRET`: a long, unique random secret.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: required for product and profile image uploads on Vercel.
- `CRON_SECRET`: required if configuring a scheduled request to `/api/cron/confirm-expired-orders`.

Add email/SMTP, Google OAuth, and payment-provider variables from `backend/.env.example` when those features are enabled. Configure provider callback URLs for the deployed domain.

Vercel's function filesystem is ephemeral. Product uploads use Cloudinary, and profile uploads use Cloudinary on Vercel. For automatic order confirmation, configure a Vercel Cron job to call `/api/cron/confirm-expired-orders` every five minutes; this cadence requires a Vercel plan that supports it.
