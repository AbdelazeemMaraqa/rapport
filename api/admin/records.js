// Lead-only: the lead's own record for each member (info, development plan, 1:1 notes).
// GET returns every member's record; PUT { id, record } replaces one. Requires the x-admin-passcode header.
import { send, fail, readBody, requireAdmin } from '../../lib/http.js';
import { storageKind, listMembers, getMember, getRecords, saveRecord } from '../../lib/store.js';
import { validateRecord } from '../../lib/validate.js';

export default async function handler(req, res) {
  if (storageKind() === 'none') return fail(res, 503, 'storage_not_configured');
  if (!(await requireAdmin(req, res))) return;
  try {
    if (req.method === 'GET') {
      const ids = (await listMembers()).map((m) => m.id);
      return send(res, 200, { records: await getRecords(ids) });
    }
    if (req.method === 'PUT') {
      let body;
      try {
        body = await readBody(req, 512 * 1024);
      } catch {
        return fail(res, 400, 'invalid', 'Body must be valid JSON under 512 KB.');
      }
      const id = String(body?.id || '');
      if (!id || !(await getMember(id))) return fail(res, 404, 'not_found', 'No member with this id.');
      const check = validateRecord(body.record);
      if (!check.ok) return fail(res, 400, 'invalid', check.error);
      const record = { ...check.value, updatedAt: new Date().toISOString() };
      await saveRecord(id, record);
      return send(res, 200, { ok: true, updatedAt: record.updatedAt });
    }
    return fail(res, 405, 'method_not_allowed');
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'storage_error', 'Storage request failed.');
  }
}
