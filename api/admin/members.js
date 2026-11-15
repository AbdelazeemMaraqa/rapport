// Lead-only: list members or remove one (with the lead's record for them). Requires the x-admin-passcode header.
import { send, fail, query, requireAdmin } from '../../lib/http.js';
import { storageKind, listMembers, deleteMember } from '../../lib/store.js';

export default async function handler(req, res) {
  if (storageKind() === 'none') return fail(res, 503, 'storage_not_configured');
  if (!(await requireAdmin(req, res))) return;
  try {
    if (req.method === 'GET') {
      const members = (await listMembers())
        .map(({ tokenHash, ...m }) => m)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return send(res, 200, { members });
    }
    if (req.method === 'DELETE') {
      const id = query(req).get('id');
      if (!id) return fail(res, 400, 'invalid', 'Missing id.');
      await deleteMember(id);
      return send(res, 200, { ok: true });
    }
    return fail(res, 405, 'method_not_allowed');
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'storage_error', 'Storage request failed.');
  }
}
