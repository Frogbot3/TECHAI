// Real route/helper/model code, disposable MongoDB, mocked Resend. No .env loading.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const loader = require("./load-ts.cjs");
const { createHmac } = require("node:crypto");

const recipient = "demo-owner@example.test";
let mongo, send, verify, EmailOtp, User, Rate, helpers, mail, deliver, logs;
const oldEnv = { ...process.env },
  oldFetch = global.fetch,
  oldError = console.error;
function request(body, headers = {}) {
  return new Request("http://localhost/api/auth/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
const code = () => mail[mail.length - 1].text.match(/\b\d{6}\b/)[0];
const sendCode = (email = recipient, headers) =>
  send(request({ email }, headers));
const verifyCode = (otp = code(), email = recipient) =>
  verify(request({ email, otp, name: "Unverified name hint" }));
const challenge = () => EmailOtp.findById(helpers.emailOtpDigest(recipient));

before(async () => {
  process.env.JWT_SECRET = "synthetic-email-otp-tests-only-secret-2026";
  process.env.RESEND_API_KEY = "re_synthetic_do_not_send";
  process.env.OTP_SENDER_EMAIL = "TECH AI <onboarding@resend.dev>";
  process.env.RESEND_TEST_EMAIL = recipient;
  delete process.env.VERCEL;
  global.fetch = async () => {
    throw new Error("Unexpected network access in email OTP tests");
  };
  console.error = (...args) => logs.push(args);
  mongo = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
  await mongoose.connect(mongo.getUri(), {
    dbName: "techai_email_otp_synthetic",
  });
  const load = loader({
    "@/lib/mongodb": {
      connectToDatabase: async () => {
        assert.equal(mongoose.connection.name, "techai_email_otp_synthetic");
      },
    },
    resend: {
      Resend: class {
        constructor(key) {
          assert.equal(key, "re_synthetic_do_not_send");
          this.emails = {
            send: async (payload) => {
              mail.push(payload);
              return deliver(payload);
            },
          };
        }
      },
    },
  });
  send = load("src/app/api/auth/send-otp/route.ts").POST;
  verify = load("src/app/api/auth/verify-otp/route.ts").POST;
  EmailOtp = load("src/models/EmailOtp.ts").default;
  User = load("src/models/User.ts").default;
  Rate = load("src/models/LoginAttempt.ts").default;
  helpers = load("src/lib/email-otp.ts");
  await Promise.all([EmailOtp.init(), User.init(), Rate.init()]);
});

beforeEach(async () => {
  logs = [];
  mail = [];
  deliver = async () => ({
    data: { id: "synthetic-resend-message" },
    error: null,
  });
  process.env.RESEND_API_KEY = "re_synthetic_do_not_send";
  process.env.OTP_SENDER_EMAIL = "TECH AI <onboarding@resend.dev>";
  process.env.RESEND_TEST_EMAIL = recipient;
  delete process.env.VERCEL;
  await Promise.all([
    EmailOtp.deleteMany({}),
    User.deleteMany({}),
    Rate.deleteMany({}),
  ]);
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
  global.fetch = oldFetch;
  console.error = oldError;
  for (const name of [
    "JWT_SECRET",
    "RESEND_API_KEY",
    "OTP_SENDER_EMAIL",
    "RESEND_TEST_EMAIL",
    "VERCEL",
  ]) {
    if (oldEnv[name] === undefined) delete process.env[name];
    else process.env[name] = oldEnv[name];
  }
});

test("accepted email stores only a salted HMAC and creates a session only after verification", async () => {
  const sent = await sendCode("  DEMO-OWNER@EXAMPLE.TEST ");
  assert.equal(sent.status, 200);
  const body = await sent.json();
  assert.equal(body.delivery, "accepted");
  assert.equal(mail[0].from, "TECH AI <onboarding@resend.dev>");
  assert.equal(mail[0].to, recipient);
  assert.match(code(), /^\d{6}$/);
  assert.equal(await User.countDocuments(), 0);
  assert.equal(sent.headers.get("set-cookie"), null);
  const saved = await challenge();
  assert.equal(saved.status, "sent");
  assert.equal(
    saved.expiresAt.getTime() - saved.lastRequestedAt.getTime(),
    600000,
  );
  assert.equal(
    saved.hash,
    helpers.emailOtpDigest(recipient + ":" + saved.challengeId + ":" + code()),
  );
  assert.ok(!JSON.stringify(saved).includes(recipient));
  assert.ok(!JSON.stringify(body).includes(code()));
  const response = await verifyCode();
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("set-cookie"),
    /techai_customer_session=.*HttpOnly/i,
  );
  assert.equal((await response.json()).user.email, recipient);
  assert.equal((await User.findOne()).provider, "email");
  assert.notEqual((await User.findOne()).name, "Unverified name hint");
  assert.equal((await challenge()).hash, null);
  assert.equal((await verifyCode()).status, 400);
});

test("Resend error objects, exceptions and missing message IDs cannot authenticate", async () => {
  for (const failure of [
    () => ({
      data: null,
      error: {
        name: "validation_error",
        message: recipient + " secret-key 123456",
      },
    }),
    () => ({
      data: { id: "must-not-trust" },
      error: { name: "validation_error" },
    }),
    () => ({ data: null, error: null }),
    () => {
      throw new Error(recipient + " secret-key 123456");
    },
  ]) {
    await EmailOtp.deleteMany({});
    deliver = failure;
    const response = await sendCode();
    assert.ok(response.status >= 500);
    assert.equal((await response.json()).success, false);
    assert.equal((await challenge()).status, "failed");
    assert.equal((await challenge()).hash, null);
    assert.equal((await verifyCode()).headers.get("set-cookie"), null);
    assert.equal(await User.countDocuments(), 0);
  }
  assert.doesNotMatch(
    JSON.stringify(logs),
    /demo-owner|secret-key|123456|re_synthetic/,
  );
});

test("unaccepted pending delivery is unverifiable, even if its code is known", async () => {
  let release;
  deliver = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const sending = sendCode();
  for (let i = 0; i < 100 && !release; i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(release);
  const response = await verifyCode();
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("set-cookie"), null);
  release({ data: null, error: { name: "validation_error" } });
  await sending;
});

test("test sender fails closed without its recipient and rejects all other addresses before sending", async () => {
  assert.equal((await sendCode("someone-else@example.test")).status, 403);
  delete process.env.RESEND_TEST_EMAIL;
  assert.equal((await sendCode()).status, 503);
  process.env.RESEND_TEST_EMAIL = recipient;
  delete process.env.RESEND_API_KEY;
  assert.equal((await sendCode()).status, 503);
  assert.equal(mail.length, 0);
  assert.equal(await EmailOtp.countDocuments(), 0);
  assert.equal(await User.countDocuments(), 0);
});

test("a late accepted response cannot activate a superseded challenge", async () => {
  let release;
  deliver = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const first = sendCode();
  for (let i = 0; i < 100 && !release; i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(release);
  const previous = await challenge();
  await EmailOtp.updateOne(
    {},
    { $set: { lastRequestedAt: new Date(Date.now() - 61000) } },
  );
  deliver = async () => ({ data: { id: "new-message" }, error: null });
  assert.equal((await sendCode()).status, 200);
  release({ data: { id: "late-message" }, error: null });
  assert.equal((await first).status, 503);
  const latest = await challenge();
  assert.notEqual(latest.challengeId, previous.challengeId);
  assert.equal(latest.status, "sent");
  assert.equal((await verifyCode()).status, 200);
});

test("database activation failure leaves a rejected request unusable and logs no exception data", async (t) => {
  const update = EmailOtp.updateOne.bind(EmailOtp);
  t.mock.method(EmailOtp, "updateOne", (query, change) => {
    if (change.$set?.status === "sent")
      throw new Error(recipient + " secret-key 123456");
    return update(query, change);
  });
  assert.equal((await sendCode()).status, 503);
  assert.equal((await verifyCode()).status, 400);
  assert.equal(await User.countDocuments(), 0);
  assert.doesNotMatch(JSON.stringify(logs), /demo-owner|secret-key|123456/);
});

test("a custom verified-domain sender supports all recipients only after removing the test restriction", async () => {
  process.env.OTP_SENDER_EMAIL = "TECH AI <login@example.test>";
  assert.equal((await sendCode("customer@example.test")).status, 403);
  delete process.env.RESEND_TEST_EMAIL;
  assert.equal((await sendCode("customer@example.test")).status, 200);
  assert.equal(mail[0].to, "customer@example.test");
});

test("expired and legacy user OTPs cannot create a session", async () => {
  await sendCode();
  await EmailOtp.updateOne(
    {},
    { $set: { expiresAt: new Date(Date.now() - 1) } },
  );
  assert.equal((await verifyCode()).status, 400);
  await EmailOtp.deleteMany({});
  await User.create({
    email: recipient,
    emailOtpHash: createHmac("sha256", process.env.JWT_SECRET)
      .update(recipient + ":123456")
      .digest("hex"),
    emailOtpExpiresAt: new Date(Date.now() + 600000),
  });
  assert.equal((await verifyCode("123456")).headers.get("set-cookie"), null);
});

test("five wrong guesses exhaust a code under concurrent verification", async () => {
  await sendCode();
  const attempts = await Promise.all(
    Array.from({ length: 12 }, () => verifyCode("000000")),
  );
  assert.ok(
    attempts.every(
      (response) =>
        response.status !== 200 && !response.headers.get("set-cookie"),
    ),
  );
  assert.equal((await challenge()).attempts, 5);
  assert.equal((await verifyCode()).status, 400);
});

test("concurrent valid submissions consume once and issue exactly one session", async () => {
  await sendCode();
  const responses = await Promise.all(
    Array.from({ length: 5 }, () => verifyCode()),
  );
  assert.equal(responses.filter((r) => r.status === 200).length, 1);
  assert.equal(responses.filter((r) => r.headers.get("set-cookie")).length, 1);
  assert.equal(await User.countDocuments(), 1);
});

test("sending never overwrites an existing Google customer's identity; verification preserves it too", async () => {
  const original = await User.create({
    email: recipient,
    provider: "google",
    firebaseUid: "synthetic-firebase-uid",
    googleId: "synthetic-google-id",
    verifiedPhone: "9000000000",
    name: "Existing Customer",
    avatar: "existing-avatar",
  });
  await sendCode();
  assert.deepEqual(
    (await User.findById(original._id)).toObject(),
    original.toObject(),
  );
  assert.equal((await verifyCode()).status, 200);
  const updated = await User.findById(original._id);
  for (const field of [
    "provider",
    "firebaseUid",
    "googleId",
    "verifiedPhone",
    "name",
    "email",
    "avatar",
  ])
    assert.equal(updated[field], original[field]);
});

test("concurrent sends admit one email, and cooldown survives successful verification", async () => {
  const responses = await Promise.all(
    Array.from({ length: 4 }, () => sendCode()),
  );
  assert.equal(responses.filter((r) => r.status === 200).length, 1);
  assert.equal(responses.filter((r) => r.status === 429).length, 3);
  assert.equal(mail.length, 1);
  await verifyCode();
  const blocked = await sendCode();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

test("resending replaces the old challenge, and email/hour limits survive challenge replacement", async () => {
  await sendCode();
  const old = await challenge();
  for (let i = 1; i < 5; i++) {
    await EmailOtp.updateOne(
      {},
      { $set: { lastRequestedAt: new Date(Date.now() - 61000) } },
    );
    assert.equal((await sendCode()).status, 200);
  }
  const current = await challenge();
  assert.notEqual(current.challengeId, old.challengeId);
  assert.notEqual(current.hash, old.hash);
  await EmailOtp.deleteMany({});
  assert.equal((await sendCode()).status, 429);
  assert.equal(mail.length, 5);
});

test("rotating recipient and spoofed forwarding headers cannot bypass the shared source limit", async () => {
  process.env.OTP_SENDER_EMAIL = "TECH AI <login@example.test>";
  delete process.env.RESEND_TEST_EMAIL;
  for (let i = 0; i < 10; i++)
    assert.equal(
      (
        await sendCode(`demo${i}@example.test`, {
          "x-forwarded-for": `198.51.100.${i}`,
          "x-vercel-forwarded-for": `198.51.100.${i}`,
        })
      ).status,
      200,
    );
  assert.equal(
    (
      await sendCode("another@example.test", {
        "x-forwarded-for": "203.0.113.1",
      })
    ).status,
    429,
  );
  assert.equal(mail.length, 10);
});

test("malformed inputs never send mail, create users or issue cookies", async () => {
  for (const email of [
    null,
    {},
    "bad",
    "a@example.test,b@example.test",
    "a@example.test\nBcc:x@example.test",
  ])
    assert.equal((await sendCode(email)).status, 400);
  assert.equal(
    (await verify(request({ email: recipient, otp: "123" }))).status,
    400,
  );
  assert.equal(
    (await send(new Request("http://localhost", { method: "POST", body: "{" })))
      .status,
    400,
  );
  assert.equal(mail.length, 0);
  assert.equal(await User.countDocuments(), 0);
});
