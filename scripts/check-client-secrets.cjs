require('@next/env').loadEnvConfig(process.cwd());
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const git = fs.existsSync('C:/Program Files/Git/cmd/git.exe') ? 'C:/Program Files/Git/cmd/git.exe' : 'git';
const secretEntries = Object.entries(process.env).filter(([key, value]) => /^(JWT_SECRET|ADMIN_PASS|MONGODB_URI|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|RESEND_API_KEY|GOOGLE_CLIENT_SECRET|CLOUDINARY_API_SECRET)$/.test(key) && value && value.length >= 8);
const tracked = execFileSync(git, ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const files = [...tracked];
for (const dir of ['.next/static', '.next-audit/static']) if (fs.existsSync(dir)) files.push(...fs.readdirSync(dir, { recursive: true }).map(file => path.join(dir, file)).filter(file => fs.statSync(file).isFile()));
const hits = [];
for (const file of files) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const body = fs.readFileSync(file, 'utf8');
  for (const [key, value] of secretEntries) if (body.includes(value)) hits.push({ file, variable: key });
}
const envHistory = execFileSync(git, ['log', '--all', '--format=', '--name-only', '--', '.env*'], { encoding: 'utf8' }).trim();
console.log({ configuredPrivateVariablesChecked: secretEntries.length, trackedEnvFiles: tracked.filter(file => /^\.env/.test(file)), envFilesInReachableHistory: Boolean(envHistory), privateValueMatches: hits });
if (hits.length || envHistory) process.exitCode = 1;
