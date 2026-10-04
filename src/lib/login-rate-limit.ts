import { connectToDatabase } from "./mongodb";
import LoginAttempt from "@/models/LoginAttempt";

export async function allowAdminLogin() {
  await connectToDatabase();
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const _id = `admin:${window}`;
  // A shared account-wide budget also works across instances and does not trust
  // client-supplied forwarding headers. The _id index serializes concurrent hits.
  let attempt;
  try {
    attempt = await LoginAttempt.findOneAndUpdate({ _id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) } }, { upsert: true, new: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    attempt = await LoginAttempt.findOneAndUpdate({ _id }, { $inc: { count: 1 } }, { new: true });
  }
  return { allowed: !!attempt && attempt.count <= 20, retryAfter: Math.ceil(((window + 1) * windowMs - Date.now()) / 1000) };
}
