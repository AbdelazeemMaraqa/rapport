// Members send their results automatically after each assessment (and again when they update).
// Only scores and completion dates are accepted; raw answers never reach the server.
import { send, fail, readBody, sha256, safeEqual, randomId, randomToken } from '../lib/http.js';
import { storageKind, getMember, saveMember, countMembers } from '../lib/store.js';
import { validateSubmission } from '../lib/validate.js';

const MAX_MEMBERS = Number(process.env.MAX_MEMBERS) || 200;

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  if (storageKind() === 'none') return fail(res, 503, 'storage_not_configured', 'No database is connected. Members can send result codes instead.');

  let body;
  try {
    body = await readBody(req);
  } catch {
    return fail(res, 400, 'invalid', 'Body must be valid JSON.');
  }

  const teamCode = process.env.TEAM_CODE;
  if (teamCode) {
    if (!body.teamCode) return fail(res, 403, 'team_code_required', 'A team code is required.');
    if (!safeEqual(String(body.teamCode).trim(), teamCode)) return fail(res, 403, 'bad_team_code', 'Wrong team code.');
  }

  const check = validateSubmission(body);
  if (!check.ok) return fail(res, 400, 'invalid', check.error);
  const now = new Date().toISOString();

  try {
    if (body.id) {
      const existing = await getMember(String(body.id));
      if (!existing) return fail(res, 404, 'not_found', 'This share no longer exists.');
      if (!body.token || !safeEqual(sha256(body.token), existing.tokenHash)) return fail(res, 403, 'bad_token', 'This share belongs to another device.');
      // Keep results sent earlier that this submission doesn't repeat; newer ones replace older ones.
      const v = check.value;
      const updated = {
        ...existing,
        ...v,
        results: { ...(existing.results || {}), ...v.results },
        completedAt: { ...(existing.completedAt || {}), ...v.completedAt },
        updatedAt: now,
      };
      await saveMember(updated);
      return send(res, 200, { id: updated.id, updatedAt: now });
    }

    if ((await countMembers()) >= MAX_MEMBERS) return fail(res, 409, 'too_many_members', 'The team has reached its member limit.');
    const id = randomId();
    const token = randomToken();
    await saveMember({ id, tokenHash: sha256(token), ...check.value, createdAt: now, updatedAt: now });
    return send(res, 201, { id, token, updatedAt: now });
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'storage_error', 'Could not save. Try again in a moment.');
  }
}
