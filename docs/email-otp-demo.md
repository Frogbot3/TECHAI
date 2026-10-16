# Email OTP demo and deployment

The email OTP routes use the existing `RESEND_API_KEY` and `OTP_SENDER_EMAIL`.
The local ignored `.env.local` has been configured with:

```dotenv
OTP_SENDER_EMAIL="TECH AI <onboarding@resend.dev>"
RESEND_TEST_EMAIL=marketing@supplycowll.com
```

The existing API key is unchanged. `RESEND_TEST_EMAIL` must be the actual address
authorized by that key's Resend account. Resend still validates this restriction;
setting a different recipient here cannot grant sending permission.

## Demo behavior

- Only the configured recipient is accepted while `RESEND_TEST_EMAIL` is set.
  The `onboarding@resend.dev` sender requires a valid test recipient and fails
  closed without one. There is no fallback sender, universal code, development
  bypass, or plaintext OTP in API responses/logs.
- Both `error` and `data.id` from Resend are checked. Rejection, exception,
  missing message ID, a 15-second timeout, or failed database activation produce
  a failure response. Such a challenge cannot create a session.
- A successful send response means **Resend accepted the message**, not confirmed
  inbox delivery. Spam filtering and later bounces remain provider/mailbox concerns.
- Codes have six cryptographically random digits, expire after ten minutes and
  permit at most five verification attempts. Atomic consumption prevents replay
  and simultaneous successful verification. A new send replaces the previous code.
- Requesting an OTP never writes to `users`. Challenges use a separate `emailotps`
  collection, HMAC keys/hashes and a TTL expiry index. Existing account provider,
  verified identifiers, name and avatar are preserved even after verification.
- Old `users.emailOtpHash` challenges are not accepted. Customers with an old
  pending email code must request a fresh one after deployment. No migration or
  bulk changes to historical users are needed.
- Rate counters reuse `loginattempts` with an isolated `email-otp:` prefix; admin
  limits and authentication are unchanged. Counters are atomic across instances.
  The expiry index handles cleanup; TTL deletion is not relied on for validation.

| Budget | Send | Verify |
| --- | --- | --- |
| Per email | 5 requests/hour, plus 60-second cooldown | 30 requests/15 minutes; maximum 5 attempts/code |
| Per source | 10 requests/15 minutes | 30 requests/15 minutes |
| Global | 50 requests/hour | 300 requests/15 minutes |

Rate windows are fixed; rejected send attempts also consume budget. Successful
verification does not reset the send cooldown or budgets. On Vercel the source
is its platform-controlled `x-vercel-forwarded-for`; elsewhere a shared source
bucket prevents spoofed forwarding headers from bypassing limits. These demo
budgets may require tuning for real traffic. Failures log fixed stage/reason codes
without raw Resend responses, request bodies, email addresses, IPs or OTPs.

## Verify locally

```powershell
npm test
npm run build
```

`tests/email-otp.test.cjs` runs the real routes against a disposable local MongoDB
and mocks only the Resend/network boundary. It does not use the configured Atlas
URI, send real mail, or modify production customer records. It includes real
concurrent send/verification tests. The MongoDB test binary may need downloading
on a fresh development machine; the dependency already exists in this project.

For the client demo, restart the local dev server after setting environment
variables, request an email code for the authorized address, and enter the code
from its inbox. Automated verification does not establish actual inbox delivery.

## Manual deployment steps

1. Review and commit the code, tests, `.env.example` and this guide. Do **not**
   commit `.env.local`. No dependency changes are required.
2. In the intended Vercel environment set the existing `RESEND_API_KEY`,
   `OTP_SENDER_EMAIL=TECH AI <onboarding@resend.dev>` and
   `RESEND_TEST_EMAIL=marketing@supplycowll.com`. In the Vercel UI, enter the
   sender value without surrounding quote characters.
3. Keep `JWT_SECRET` (at least 32 characters), `MONGODB_URI` and `MONGODB_DB_NAME`
   configured. Use a staging database for pre-production demos. Database access
   must permit the new `emailotps` collection/index and the existing rate-counter
   collection; the model declares its TTL index. No production data was migrated.
4. Deploy manually, then smoke-test accepted/rejected recipients, the inbox code,
   expiry, single use and the existing Google sign-in. A sender/configuration
   change requires a restart locally or a new deployment on Vercel.

## Enable all customers later

After purchasing and **verifying** your sending domain in Resend, set
`OTP_SENDER_EMAIL` to an address on that domain (for example,
`TECH AI <login@your-verified-domain>`), remove `RESEND_TEST_EMAIL`, and redeploy.
Both changes are required: a remaining test recipient continues to restrict all
sends. Keep the API key server-only and appropriately scoped to the sending domain.

References: [Resend testing-domain restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain),
[Resend SDK result handling](https://resend.com/docs/send-with-nextjs),
[Vercel request headers](https://vercel.com/docs/headers/request-headers).
