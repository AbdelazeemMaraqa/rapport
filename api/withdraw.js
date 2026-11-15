// A member removes everything they shared, using the token stored on their device.
import { send, fail, readBody, sha256, safeEqual } from '../lib/http.js';
import { storageKind, getMember, deleteMember } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  if (storageKind() === 'none') return fail(res, 503, 'storage_not_configured');
  let body;
  try {
    body = await readBody(req);
  } catch {
    return fail(res, 400, 'invalid', 'Body must be valid JSON.');
  }
  try {
    const existing = body.id ? await getMember(String(body.id)) : null;
    if (!existing) return fail(res, 404, 'not_found');
    if (!body.token || !safeEqual(sha256(body.token), existing.tokenHash)) return fail(res, 403, 'bad_token');
    await deleteMember(existing.id);
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'storage_error', 'Could not delete. Try again in a moment.');
  }
}
