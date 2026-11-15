// Helpers shared by the API functions. They use plain Node APIs so they run on Vercel and in scripts/dev.mjs.
import crypto from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(data));
}

export function fail(res, status, error, message) {
  send(res, status, { error, message: message || error });
}

export async function readBody(req, maxBytes = 64 * 1024) {
  // Vercel parses JSON bodies into req.body; the local dev server leaves the stream for us.
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Body too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export function query(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

export function safeEqual(a, b) {
  const x = Buffer.from(sha256(a));
  const y = Buffer.from(sha256(b));
  return crypto.timingSafeEqual(x, y);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Returns true when the request carries the right admin passcode; otherwise sends the error itself. */
export async function requireAdmin(req, res) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    fail(res, 503, 'admin_not_configured', 'Set ADMIN_PASSCODE in your environment variables.');
    return false;
  }
  const given = req.headers['x-admin-passcode'] || '';
  if (!safeEqual(given, expected)) {
    await sleep(600); // slows down guessing
    fail(res, 401, 'unauthorized', 'Wrong passcode.');
    return false;
  }
  return true;
}

export function randomId(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export const randomToken = () => crypto.randomBytes(24).toString('hex');
