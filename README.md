# TECH AI E-Commerce

A modern Next.js e-commerce platform. Run `npm install` then `npm run dev` to start.
# TECHAI

## MongoDB migration

The application now targets the `techai` database through `MONGODB_DB_NAME` (default: `techai`). Keep the existing credential-bearing `MONGODB_URI` server-only and set this explicitly in Vercel:

```env
MONGODB_DB_NAME=techai
```

Run `node scripts/mongodb-migration.js` for a read-only audit. Run `node scripts/mongodb-migration.js --execute` only when ready to copy data. The migration preserves source `_id` values and indexes, creates a timestamped `test_backup_...` backup database, verifies counts and logical relationships, and never drops the original `test` database.

## Refund operations

Refunds use the existing order-level Razorpay payment fields and a new `Refund` collection. Add the server-only webhook secret to `.env.local`:

```env
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

The server-side Razorpay integration uses `RAZORPAY_KEY_ID` (preferred), `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. The existing `NEXT_PUBLIC_RAZORPAY_KEY_ID` is retained as a local backwards-compatible fallback for the public checkout key. Never expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to the browser.

In the Razorpay Dashboard, create a webhook pointing to `https://your-domain.com/api/webhooks/razorpay`, configure the same secret, and subscribe to `refund.created`, `refund.pending`, `refund.processed`, and `refund.failed`. The webhook endpoint verifies `x-razorpay-signature` and deduplicates event IDs. Admins can also use “Reconcile Razorpay status” for a processing refund.

Refund eligibility is based on the latest `Delivered` timestamp in an order’s status history, lasts seven days, excludes shipping charges, and only accepts captured paid Razorpay orders. A refund is shown as completed only after a verified Razorpay webhook or server-side reconciliation confirms it.
# TECHAI
