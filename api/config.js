import { send, fail } from '../lib/http.js';
import { storageKind } from '../lib/store.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');
  send(res, 200, {
    storage: storageKind(),
    teamCodeRequired: Boolean(process.env.TEAM_CODE),
    adminConfigured: Boolean(process.env.ADMIN_PASSCODE),
  });
}
